import { providerErrorReason } from '@0xintuition/pipeline-runtime/provider-observer';
import {
	beginObservedRequest,
	type ObservedRequestContext,
	type RequestOutcome,
} from '@0xintuition/pipeline-runtime/provider-request-observation';
import type { ProviderHopSink } from './http';
import { BLOCKED_STATUSES, DEAD_URL_STATUSES } from './page-statuses';
import { classifyTransportError } from './provider-request-observer';

/**
 * Observation of the HTML page fetch of enrichment's opengraph and microdata plugins
 * (ENG-16911 for goodreads.com, ENG-17017 for every other page).
 *
 * The two plugins share one fetch of the pasted page per run (ENG-16980): the plugin that ran it
 * records `live`, the other records `cache` (a hit or a miss; a failure is recorded once, by the
 * live fetch). Each plugin starts one tracker per logical page consumption, hands `sink` to the
 * shared HTTP hop (which only reports the status and headers of the latest hop it received), and
 * calls `finish` or `fail` exactly once. A logical fetch is one count however many redirects it
 * followed, and a fetch that ends on a redirect is counted (as `invalid_response`).
 *
 * One mechanism, two profiles: a Goodreads host is recorded as `goodreads|page` with Goodreads'
 * own rules (it sits behind AWS WAF, which answers a challenge with a bare 202; a sign-in wall is an
 * off-site redirect); every other http(s) page is `web|page`, which has no host label so its series
 * count is fixed.
 *
 * Observation only: it never throws, never changes a result and never dials.
 */
type PageProfile = {
	provider: 'goodreads' | 'web';
	/** A bare 202 is a WAF challenge (a Goodreads book page is never served as 202). */
	bare202IsChallenge: boolean;
	/** The provider's own hosts: a redirect that left them is not one of its pages. Absent: any host. */
	ownHosts?: ReadonlySet<string>;
	/** Statuses that mean the site refused us. */
	blockedStatuses: ReadonlySet<number>;
	/** A fetched 2xx page without usable metadata: a miss (Goodreads) or still a hit (web, it was fetched). */
	unusablePage: 'hit' | 'miss';
	/** A host that does not exist or does not answer: a miss for web, not observed for Goodreads. */
	deadHostIsMiss: boolean;
	/** A refusal by our own policy (embargo, page-source policy, private address) is not provider behaviour. */
	policyRefusalIsUnobserved: boolean;
	/** Tells a page without metadata and a dead URL apart on the live series (the registry declares them). */
	detailedOutcomes: boolean;
};

const GOODREADS_PAGE_HOSTS: ReadonlySet<string> = new Set([
	'goodreads.com',
	'www.goodreads.com',
	// Accepted by the classifier; a DNS failure here is a real signal (`network`).
	'm.goodreads.com',
]);

const GOODREADS_PROFILE: PageProfile = {
	provider: 'goodreads',
	bare202IsChallenge: true,
	ownHosts: GOODREADS_PAGE_HOSTS,
	blockedStatuses: new Set(),
	unusablePage: 'miss',
	deadHostIsMiss: false,
	policyRefusalIsUnobserved: false,
	detailedOutcomes: false,
};

const WEB_PROFILE: PageProfile = {
	provider: 'web',
	bare202IsChallenge: false,
	blockedStatuses: BLOCKED_STATUSES,
	unusablePage: 'hit',
	deadHostIsMiss: true,
	policyRefusalIsUnobserved: true,
	detailedOutcomes: true,
};

/** Header AWS WAF answers with (`allow` is not a challenge) and the one Cloudflare uses (`challenge`). */
const AWS_WAF_ACTION_HEADER = 'x-amzn-waf-action';
const CLOUDFLARE_MITIGATED_HEADER = 'cf-mitigated';

/** Error classes of a refusal by our own policy (not the provider's answer); unobserved where the profile opts out. */
const POLICY_REFUSALS: ReadonlySet<string> = new Set([
	'embargoed_host',
	'page_source_denied',
	'target_rejected',
]);

function parseHttpUrl(url: string): URL | undefined {
	try {
		const parsed = new URL(url);
		return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed : undefined;
	} catch {
		return undefined;
	}
}

function isOwnHost(url: string, hosts: ReadonlySet<string>): boolean {
	const parsed = parseHttpUrl(url);
	return parsed !== undefined && hosts.has(parsed.hostname.toLowerCase().replace(/\.+$/u, ''));
}

/** @internal Whether a URL is a goodreads.com page (exported for tests; callers use `startPageFetch`). */
export function isGoodreadsPageUrl(url: string): boolean {
	return isOwnHost(url, GOODREADS_PAGE_HOSTS);
}

/** The profile that records a page: Goodreads hosts keep `goodreads|page`, any other http(s) page is `web|page`. */
function profileFor(url: string): PageProfile | undefined {
	if (!parseHttpUrl(url)) return undefined;
	return isGoodreadsPageUrl(url) ? GOODREADS_PROFILE : WEB_PROFILE;
}

/**
 * A WAF challenge: AWS WAF announces one in a header (and, on Goodreads, as a bare 202); Cloudflare
 * uses `cf-mitigated`.
 */
function isChallenge(
	hop: { status: number; headers: Headers },
	profile: Pick<PageProfile, 'bare202IsChallenge'>
): boolean {
	if (hop.status === 202 && profile.bare202IsChallenge) return true;
	const waf = hop.headers.get(AWS_WAF_ACTION_HEADER);
	if (waf && waf.toLowerCase() !== 'allow') return true;
	return hop.headers.get(CLOUDFLARE_MITIGATED_HEADER)?.toLowerCase() === 'challenge';
}

type LastHop = { status: number; wafChallenge: boolean; offSite: boolean };

const hit = (profile: PageProfile, usable: boolean): RequestOutcome => ({
	outcome: 'hit',
	reason: usable || !profile.detailedOutcomes ? 'none' : 'no_metadata',
});

const dead = (profile: PageProfile): RequestOutcome => ({
	outcome: 'miss',
	reason: profile.detailedOutcomes ? 'dead_url' : 'none',
});

/** The outcome of the latest hop of a finished fetch, or `undefined` when nothing was dialled. */
function classifyHop(
	profile: PageProfile,
	last: LastHop | undefined,
	usable: boolean
): RequestOutcome | undefined {
	if (!last) return undefined;
	if (last.wafChallenge) return { outcome: 'error', reason: 'blocked' };
	if (last.offSite) return { outcome: 'error', reason: 'invalid_response' };
	const { status } = last;
	// The fetch ended on a redirect: a loop, a cap, a cross-host or sign-in wall.
	if (status >= 300 && status < 400) return { outcome: 'error', reason: 'invalid_response' };
	if (status >= 200 && status < 300) {
		return usable || profile.unusablePage === 'hit'
			? hit(profile, usable)
			: { outcome: 'miss', reason: 'none' };
	}
	if (DEAD_URL_STATUSES.has(status)) return dead(profile);
	if (profile.blockedStatuses.has(status)) return { outcome: 'error', reason: 'blocked' };
	return { outcome: 'error', reason: providerErrorReason({ status }) };
}

/** The outcome of a failed fetch, or `undefined` when it is not provider behaviour (not recorded). */
function classifyFailure(
	profile: PageProfile,
	error: unknown,
	last: LastHop | undefined
): RequestOutcome | undefined {
	const transport = classifyTransportError(error);
	if (transport) return transport;
	if (!last) {
		const errorClass = (error as { errorClass?: unknown } | null)?.errorClass;
		if (profile.policyRefusalIsUnobserved) {
			if (typeof errorClass === 'string' && POLICY_REFUSALS.has(errorClass)) return undefined;
		} else if (errorClass === 'target_rejected') {
			// Goodreads' host list is fixed, so a guard refusal there can only be a failed lookup.
			return { outcome: 'error', reason: 'network' };
		}
		return { outcome: 'error', reason: 'other' };
	}
	// A failure after a 2xx (body read, size) is not the provider's status.
	if (last.status >= 200 && last.status < 300 && !last.wafChallenge) {
		return { outcome: 'error', reason: 'other' };
	}
	return classifyHop(profile, last, false) ?? { outcome: 'error', reason: 'other' };
}

/**
 * Why the guard refused a page before (or while) dialling:
 * - `policy`: our own rule (private or internal address, bad scheme, embargo, page-source policy);
 * - `lookup_not_found`: the host does not exist;
 * - `lookup_failed`: the lookup failed for another reason.
 */
export type PageRefusal = 'policy' | 'lookup_not_found' | 'lookup_failed';

const POLICY_REASONS: ReadonlySet<string> = new Set([
	'private_address',
	'invalid_scheme',
	'invalid_url',
	'page_source_denied',
	'refused_host',
]);

/** The refusal an opengraph result reports (`redirect_` variants included), or `undefined` for any other result. */
export function pageRefusal(result: { status: string; reason: string }): PageRefusal | undefined {
	if (result.status !== 'blocked') return undefined;
	const reason = result.reason.replace(/^redirect_/u, '');
	if (reason === 'lookup_not_found' || reason === 'lookup_failed') return reason;
	return POLICY_REASONS.has(reason) ? 'policy' : undefined;
}

export type PageFetchResult = {
	/** Whether the plugin got metadata from a 2xx page. */
	usable: boolean;
	/** The guard refused the target; see {@link PageRefusal}. */
	refusal?: PageRefusal | undefined;
	/** The host never answered (opengraph's `dead_url` without a response). */
	deadUrl?: boolean;
	/** The head was not closed within the size cap: the page was fetched, no metadata was read. */
	headCapExceeded?: boolean;
};

/** The outcome of a finished fetch, or `undefined` to record nothing. */
function finishOutcome(
	profile: PageProfile,
	last: LastHop | undefined,
	result: PageFetchResult
): RequestOutcome | undefined {
	if (result.refusal === 'policy' && profile.policyRefusalIsUnobserved) return undefined;
	// Goodreads keeps recording an over-long head as the failure it always was.
	if (result.headCapExceeded && profile.unusablePage === 'miss') {
		return { outcome: 'error', reason: 'other' };
	}
	const fromHop = classifyHop(profile, last, result.usable);
	if (fromHop) return fromHop;
	if (result.refusal === 'lookup_not_found' && profile.deadHostIsMiss) return dead(profile);
	if (result.refusal) return { outcome: 'error', reason: 'network' };
	if (result.deadUrl && profile.deadHostIsMiss) return dead(profile);
	return undefined;
}

/** `cache` is a consumer of another plugin's fetch: it never carries a live-only reason. */
function forSource(outcome: RequestOutcome, source: 'live' | 'cache'): RequestOutcome {
	return source === 'live' || outcome.outcome === 'error'
		? outcome
		: { outcome: outcome.outcome, reason: 'none' };
}

export type PageFetch = {
	/** Pass to the shared hop; absent when the fetch is not observed. */
	sink: ProviderHopSink | undefined;
	/** The fetch ended with a result. */
	finish(result: PageFetchResult): void;
	/** The fetch threw. */
	fail(error: unknown): void;
};

const INERT: PageFetch = {
	sink: undefined,
	finish: () => undefined,
	fail: () => undefined,
};

/**
 * Starts the tracker of one logical page fetch: `goodreads|page` for a Goodreads host, `web|page`
 * for any other http(s) URL, inert for anything else. `cache` is a consumer of a fetch another
 * plugin of the run already made (ENG-16980): replay that fetch's hops into `sink`, then
 * `finish`/`fail`.
 */
export function startPageFetch(
	url: string,
	context: ObservedRequestContext,
	source: 'live' | 'cache' = 'live'
): PageFetch {
	try {
		const profile = profileFor(url);
		if (!profile) return INERT;
		const observed = beginObservedRequest({
			provider: profile.provider,
			operation: 'page',
			context,
			source,
		});
		if (!observed) return INERT;
		let last: LastHop | undefined;
		return {
			sink: {
				// Our own per-host pacing queue: a deadline reached there dialled nothing (not a site timeout).
				queued: () => observed.queued(),
				dialing: () => observed.dialed(),
				record: (hop) => {
					last = {
						status: hop.status,
						wafChallenge: isChallenge(hop, profile),
						offSite: profile.ownHosts !== undefined && !isOwnHost(hop.url, profile.ownHosts),
					};
				},
			},
			finish: (result) => {
				try {
					const outcome = finishOutcome(profile, last, result);
					if (outcome) observed.settle(forSource(outcome, source));
					else observed.drop();
				} catch {
					// Observation must never alter the request.
				}
			},
			fail: (error) => {
				try {
					// `undefined` records nothing: a refusal by our own policy is not provider behaviour.
					observed.fail(error, (e) => {
						const outcome = classifyFailure(profile, e, last);
						return outcome && forSource(outcome, source);
					});
				} catch {
					// Observation must never alter the request.
				}
			},
		};
	} catch {
		return INERT;
	}
}
