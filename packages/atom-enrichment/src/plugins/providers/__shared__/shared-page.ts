import type { ResolvePublicHostname } from '../../../image-policy';
import { authorizeOpenGraphPageSource } from '../../../image-policy';
import type { RunPageCache } from '../../../page-cache';
import { fetchOpenGraphMetadata, type OpenGraphFetchResult } from '../opengraph/fetch';
import {
	BROWSER_FETCH_HEADERS,
	type FetchLike,
	isEmbargoedHost,
	MAX_PROVIDER_HTTP_RESPONSE_BYTES,
	type ProviderHopSink,
} from './http';
import { type PageFetch, startPageFetch } from './page-observer';

/**
 * The HTML page fetch plugins of one run share (ENG-16980).
 *
 * Opengraph and microdata both read the page the user pasted. Rather than each
 * dialling it (two fetches per paste, which a rate-limiting WAF such as
 * Goodreads' counts), the plugins fetch through this function: the first caller
 * makes the request and the others of the same run reuse its settled outcome,
 * success or failure alike. The request keeps everything the opengraph fetch
 * always had: SSRF pinning and per-hop re-validation, the page-source policy on
 * every hop, per-host pacing, the head cap, and the hop sink for observation.
 *
 * One request has to serve every plugin of the run, so it is shaped by what the
 * run's consumers need (`planSharedPageFetch`), not by whichever plugin dials:
 * - browser headers (Letterboxd serves its JSON-LD only to a browser user agent;
 *   a live comparison showed identical status and og: tags for both user agents on
 *   Goodreads, Wikipedia and Letterboxd), except on Wikimedia hosts, whose user-agent
 *   policy asks for a descriptive one (opengraph's own);
 * - the whole body up to microdata's 1 MB cap, only when a run has a plugin that reads it,
 *   so an opengraph-only run still stops at `</head>`;
 * - TMDB/IMDb embargo: microdata never fetched those hosts, so a request without an
 *   opengraph consumer refuses them before dialling, and microdata rejects a shared
 *   page that went through one.
 *
 * The request is also not owned by the plugin that started it: it aborts only
 * when every consumer has aborted, and each consumer's own timeout and
 * cancellation fail that consumer alone (see `RunPageCache`).
 */

/** Only pages this policy admits go through the shared fetch (the opengraph plugin's own policy). */
export const SHARED_PAGE_SOURCE_CONTEXT = { genericUserPasted: true } as const;

export type SharedPageConsumer = 'opengraph' | 'microdata';

type ConsumerNeeds = {
	/** Reads the page body, not just the head. */
	body: boolean;
	/** Accepts a page the TMDB/IMDb embargo covers (opengraph's policy allows TMDB pages). */
	followsEmbargoed: boolean;
};

const CONSUMER_NEEDS: Readonly<Record<SharedPageConsumer, ConsumerNeeds>> = {
	opengraph: { body: false, followsEmbargoed: true },
	microdata: { body: true, followsEmbargoed: false },
};

/** Whether a plugin id fetches pages through the shared request (its needs shape the plan). */
export function isSharedPageConsumer(id: string): boolean {
	return Object.hasOwn(CONSUMER_NEEDS, id);
}

export type SharedPagePlan = { retainBody: boolean; allowEmbargoed: boolean };

/** What the one request must do to serve every plugin of the run (unknown ids need nothing). */
export function planSharedPageFetch(consumers: Iterable<string>): SharedPagePlan {
	const plan = { retainBody: false, allowEmbargoed: false };
	for (const id of consumers) {
		const needs = (CONSUMER_NEEDS as Record<string, ConsumerNeeds | undefined>)[id];
		if (!needs) continue;
		plan.retainBody ||= needs.body;
		plan.allowEmbargoed ||= needs.followsEmbargoed;
	}
	return plan;
}

/** Whether the shared fetch may request this URL. Others keep their plugin's own fetch. */
export function isSharedPageUrl(url: string): boolean {
	return authorizeOpenGraphPageSource(url, SHARED_PAGE_SOURCE_CONTEXT) !== undefined;
}

export type RecordedHop = Parameters<ProviderHopSink['record']>[0];
type SharedPageOutcome =
	| { hops: RecordedHop[]; result: OpenGraphFetchResult }
	| { hops: RecordedHop[]; error: unknown };

const SHARED_REQUEST_HEADERS: Record<string, string> = Object.fromEntries(
	Object.entries(BROWSER_FETCH_HEADERS).map(([name, value]) => [name.toLowerCase(), value])
);

const WIKIMEDIA_HOST_SUFFIXES = ['wikipedia.org', 'wikimedia.org'];

/** Browser headers, or undefined (the fetch's own descriptive user agent) for Wikimedia hosts. */
function requestHeadersFor(url: string): Record<string, string> | undefined {
	let host: string;
	try {
		host = new URL(url).hostname.toLowerCase().replace(/\.+$/u, '');
	} catch {
		return SHARED_REQUEST_HEADERS;
	}
	return WIKIMEDIA_HOST_SUFFIXES.some((suffix) => host === suffix || host.endsWith(`.${suffix}`))
		? undefined
		: SHARED_REQUEST_HEADERS;
}

// Callers that bring their own transport or resolver get their own request.
const identities = new WeakMap<object, number>();
let nextIdentity = 1;
function identityOf(value: object | undefined): string {
	if (!value) return '-';
	let id = identities.get(value);
	if (id === undefined) {
		id = nextIdentity++;
		identities.set(value, id);
	}
	return String(id);
}

function cacheKey(
	url: string,
	plan: SharedPagePlan,
	fetcher: FetchLike,
	resolveHostname: ResolvePublicHostname | undefined
): string {
	return [
		`plan:${plan.retainBody ? 'body' : 'head'}/${plan.allowEmbargoed ? 'follow' : 'refuse'}`,
		`fetch:${identityOf(fetcher)}`,
		`resolve:${identityOf(resolveHostname)}`,
		url,
	].join('|');
}

export type LoadSharedPageOptions = {
	url: string;
	consumer: SharedPageConsumer;
	/** The run's cache (`ctx.pages`); without one the page is fetched for this caller alone. */
	pages?: RunPageCache | undefined;
	fetch: FetchLike;
	resolveHostname?: ResolvePublicHostname | undefined;
	allowLoopbackFixtures?: boolean | undefined;
	signal?: AbortSignal | undefined;
	deadlineAtMs?: number | undefined;
	/**
	 * This consumer's own timer; none by default. It bounds this consumer's wait and its
	 * observed deadline, never the request the other consumers share.
	 */
	timeoutMs?: number | undefined;
	/**
	 * The error this consumer reports for a failed or abandoned fetch (opengraph reports
	 * its normalized fetch errors, microdata the provider HTTP error it always threw).
	 */
	mapError?: ((error: unknown) => unknown) | undefined;
};

export type LoadedSharedPage = {
	result: OpenGraphFetchResult;
	hops: readonly RecordedHop[];
	page: PageFetch;
	source: 'live' | 'cache';
};

/**
 * A timer that aborts like the fetch's own timer always did (an AbortError), cleared by `dispose`.
 */
function startTimer(ms: number): { signal: AbortSignal | undefined; dispose: () => void } {
	if (!Number.isFinite(ms)) return { signal: undefined, dispose: () => undefined };
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), ms);
	return { signal: controller.signal, dispose: () => clearTimeout(timer) };
}

/**
 * Loads the page, sharing it with the other plugins of the run. Resolves with
 * the fetch result and the observation tracker of THIS consumer (`live` for the
 * one that made the request, `cache` for the others): the caller reports
 * `finish` with its own notion of "usable". A failed fetch is observed here and
 * rethrown, the same error for every consumer.
 */
export async function loadSharedPage(options: LoadSharedPageOptions): Promise<LoadedSharedPage> {
	const { url, consumer } = options;
	const mapError = options.mapError ?? ((error: unknown) => error);
	const plan = planSharedPageFetch([...(options.pages?.consumers ?? []), consumer]);
	const timeoutMs = options.timeoutMs ?? Number.POSITIVE_INFINITY;
	const timer = startTimer(timeoutMs);
	const signals = [options.signal, timer.signal].filter((s): s is AbortSignal => s !== undefined);
	const ownSignal = signals.length > 0 ? AbortSignal.any(signals) : undefined;
	// The fetch's own timer is a real provider timeout, so it bounds the observed
	// deadline together with the engine's.
	const observed = {
		signal: ownSignal,
		deadlineAtMs: Math.min(
			options.deadlineAtMs ?? Number.POSITIVE_INFINITY,
			Date.now() + timeoutMs
		),
	};

	let livePage: PageFetch | undefined;
	const load = async (shared: { signal: AbortSignal }): Promise<SharedPageOutcome> => {
		const page = startPageFetch(url, observed, 'live');
		livePage = page;
		const hops: RecordedHop[] = [];
		const hopSink: ProviderHopSink = {
			record: (hop) => {
				hops.push(hop);
				page.sink?.record(hop);
			},
			queued: () => page.sink?.queued?.(),
			dialing: () => page.sink?.dialing?.(),
		};
		try {
			const result = await fetchOpenGraphMetadata(url, {
				fetch: options.fetch,
				pageSourceContext: { ...SHARED_PAGE_SOURCE_CONTEXT },
				resolveHostname: options.resolveHostname,
				signal: shared.signal,
				allowLoopbackFixtures: options.allowLoopbackFixtures,
				headers: requestHeadersFor(url),
				...(plan.retainBody ? { retainBodyBytes: MAX_PROVIDER_HTTP_RESPONSE_BYTES } : {}),
				...(plan.allowEmbargoed
					? {}
					: { refuseUrl: (target: URL) => isEmbargoedHost(target.href) }),
				hopSink,
				// The shared signal is the request's only timer: it lives as long as its most patient consumer.
				timeoutMs: Number.POSITIVE_INFINITY,
			});
			return { hops, result };
		} catch (error) {
			return { hops, error };
		}
	};

	let loaded: { outcome: SharedPageOutcome; source: 'live' | 'cache' };
	try {
		loaded = options.pages
			? await options.pages.getOrLoad(
					cacheKey(url, plan, options.fetch, options.resolveHostname),
					{ signal: ownSignal },
					load
				)
			: await alone(load, ownSignal);
	} catch (abandoned) {
		// This consumer gave up (its timeout, a cancel) while the request went on for others.
		const error = mapError(abandoned);
		(livePage ?? startPageFetch(url, observed, 'cache')).fail(error);
		throw error;
	} finally {
		timer.dispose();
	}

	const { outcome, source } = loaded;
	const page =
		source === 'live' && livePage
			? livePage
			: replayHops(startPageFetch(url, observed, 'cache'), outcome.hops);
	if ('error' in outcome) {
		const error = mapError(outcome.error);
		page.fail(error);
		throw error;
	}
	return { result: outcome.result, hops: outcome.hops, page, source };
}

/** No run cache: the request is this consumer's alone, aborted when it gives up. */
async function alone(
	load: (shared: { signal: AbortSignal }) => Promise<SharedPageOutcome>,
	signal: AbortSignal | undefined
): Promise<{ outcome: SharedPageOutcome; source: 'live' }> {
	const controller = new AbortController();
	const forward = () => controller.abort(signal?.reason);
	signal?.addEventListener('abort', forward, { once: true });
	if (signal?.aborted) forward();
	try {
		return { outcome: await load({ signal: controller.signal }), source: 'live' };
	} finally {
		signal?.removeEventListener('abort', forward);
	}
}

function replayHops(page: PageFetch, hops: readonly RecordedHop[]): PageFetch {
	for (const hop of hops) page.sink?.record(hop);
	return page;
}
