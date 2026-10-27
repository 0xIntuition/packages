import type { ResolvePublicHostname } from '../../../image-policy';
import { defineEnrichmentPlugin, type EnrichmentPlugin } from '../../../plugins';
import type { EnrichmentRequest } from '../../../types';
import { runWithHostPolicy } from '../__shared__/host-policy';
import {
	BROWSER_FETCH_HEADERS,
	type FetchLike,
	fetchText,
	isEmbargoedHost,
	ProviderHttpError,
	parseRetryAfterMs,
} from '../__shared__/http';
import { isOpenGraphHttpError, OpenGraphFetchError } from '../__shared__/page-fetch-error';
import { startPageFetch } from '../__shared__/page-observer';
import { getRequestUrl } from '../__shared__/request';
import { isSharedPageUrl, type LoadedSharedPage, loadSharedPage } from '../__shared__/shared-page';
import { microdataDataSchema } from './schema';

type CreateMicrodataPluginOptions = {
	fetch?: FetchLike;
	priority?: number;
	/** Test seam for the DNS check of the page fetch (opengraph has the same). */
	resolveHostname?: ResolvePublicHostname;
	TTL?: number;
};

const MAX_HTML_LENGTH = 1_500_000;
const MAX_JSON_LD_NODES = 12;
const MAX_NODE_JSON_LENGTH = 50_000;
const JSON_LD_SCRIPT_PATTERN =
	/<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

// Hosts whose pages never carry useful entity JSON-LD for our purposes
// (platform shells; their content is owned by dedicated plugins).
const SKIPPED_HOST_SUFFIXES = [
	'maps.app.goo.gl',
	'goo.gl',
	'maps.google.com',
	'open.spotify.com',
	'wikidata.org',
];

function shouldSkipUrl(url: string): boolean {
	try {
		const parsed = new URL(url);
		const host = parsed.hostname.replace(/^www\./, '').toLowerCase();
		if (SKIPPED_HOST_SUFFIXES.some((suffix) => host === suffix || host.endsWith(`.${suffix}`))) {
			return true;
		}
		return (
			(host === 'google.com' || host.endsWith('.google.com')) && parsed.pathname.startsWith('/maps')
		);
	} catch {
		return true;
	}
}

function decodeJsonLdText(raw: string): string {
	// Some publishers (e.g. Letterboxd) wrap JSON-LD in CDATA comment guards;
	// others HTML-escape ampersands. Strip both before parsing.
	return raw
		.trim()
		.replace(/^\/\*\s*<!\[CDATA\[\s*\*\//, '')
		.replace(/\/\*\s*\]\]>\s*\*\/$/, '')
		.trim()
		.replace(/&amp;/g, '&');
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

// Flattens a parsed ld+json payload into entity nodes: top-level arrays and
// `@graph` containers both unwrap; non-object entries are dropped.
export function flattenJsonLdNodes(parsed: unknown): Record<string, unknown>[] {
	const queue: unknown[] = Array.isArray(parsed) ? [...parsed] : [parsed];
	const nodes: Record<string, unknown>[] = [];

	while (queue.length > 0 && nodes.length < MAX_JSON_LD_NODES) {
		const entry = queue.shift();
		if (!isRecord(entry)) continue;
		const graph = entry['@graph'];
		if (Array.isArray(graph)) {
			queue.push(...graph);
			// Some publishers put properties beside @graph too; keep the node
			// itself when it carries a type.
			if (entry['@type'] === undefined) continue;
		}
		if (JSON.stringify(entry).length > MAX_NODE_JSON_LENGTH) continue;
		nodes.push(entry);
	}

	return nodes;
}

export function parseJsonLdBlocks(html: string): Record<string, unknown>[] {
	const nodes: Record<string, unknown>[] = [];
	for (const match of html.matchAll(JSON_LD_SCRIPT_PATTERN)) {
		if (nodes.length >= MAX_JSON_LD_NODES) break;
		const raw = match[1];
		if (!raw) continue;
		try {
			const parsed = JSON.parse(decodeJsonLdText(raw));
			nodes.push(...flattenJsonLdNodes(parsed));
		} catch {
			// Malformed block — publishers ship broken JSON all the time; skip.
		}
	}
	return nodes.slice(0, MAX_JSON_LD_NODES);
}

function readTitle(html: string): string | undefined {
	const match = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
	const title = match?.[1]?.trim();
	return title && title.length > 0 ? title.slice(0, 512) : undefined;
}

// Reads the entity's own image from json-ld nodes. Image values appear as a
// bare url string, an ImageObject ({url}), or arrays of either — Google
// requires `image` on Event/Product/Article rich results, so this is the
// page's authoritative visual for the entity.
export function readPrimaryJsonLdImage(
	nodes: readonly Record<string, unknown>[]
): string | undefined {
	for (const node of nodes) {
		const image = readImageValue(node.image);
		if (image) return image;
	}
	return undefined;
}

function readImageValue(value: unknown): string | undefined {
	const candidates = Array.isArray(value) ? value : [value];
	for (const entry of candidates) {
		if (typeof entry === 'string' && /^https?:\/\//.test(entry.trim())) {
			return entry.trim();
		}
		if (entry && typeof entry === 'object' && !Array.isArray(entry)) {
			const url = (entry as Record<string, unknown>).url;
			if (typeof url === 'string' && /^https?:\/\//.test(url.trim())) {
				return url.trim();
			}
		}
	}
	return undefined;
}

// What the shared fetch (opengraph's, normalized) reports as the error this plugin's own
// fetch always threw: provider HTTP errors keep status, retry-after and class, and a
// transport error is the original one. No `errorClass`: the parity tests pin microdata's error
// (message and class) byte for byte as it was before the fetch was shared.
function toMicrodataError(error: unknown): unknown {
	if (!(error instanceof OpenGraphFetchError)) return error;
	if (isOpenGraphHttpError(error)) {
		return new ProviderHttpError({
			status: error.httpStatus,
			retryAfterMs: error.retryAfterMs,
		});
	}
	if (error.code === 'redirect_limit') {
		return new ProviderHttpError({
			status: error.httpStatus ?? 310,
			errorClass: 'redirect_exhausted',
		});
	}
	return error.originalError ?? error;
}

const TARGET_REJECTED_REASON =
	/(^|_)(private_address|lookup_not_found|lookup_failed|invalid_scheme|invalid_url)$/;

// The page body of a fetch shared with the opengraph plugin. A page that did not
// load fails like the plugin's own fetch always did: a ProviderHttpError.
function readSharedHtml({ result, hops }: Pick<LoadedSharedPage, 'result' | 'hops'>): string {
	// Never read a page that went through an embargoed host (TMDB, IMDb), also behind a redirect.
	if (
		isEmbargoedHost(result.finalUrl) ||
		hops.some((hop) => isEmbargoedHost(hop.url)) ||
		result.reason.endsWith('refused_host')
	) {
		throw new ProviderHttpError({ status: 451, errorClass: 'embargoed_host' });
	}
	if (result.reason === 'redirect_page_source_denied') {
		// A redirect to a page the opengraph policy denies. Its only deny rule is IMDb, which the
		// embargo above already refused; any rule added later is refused here rather than followed.
		throw new ProviderHttpError({ status: 451, errorClass: 'page_source_denied' });
	}
	if (result.status === 'fetched' || result.status === 'no_metadata') {
		if (result.fullBody?.status === 'fetched') return result.fullBody.html;
		throw new ProviderHttpError({ status: 413, errorClass: 'response_too_large' });
	}
	if (TARGET_REJECTED_REASON.test(result.reason)) {
		throw new ProviderHttpError({ status: 400, errorClass: 'target_rejected' });
	}
	const last = hops.at(-1);
	if (result.reason === 'redirect_missing_location') {
		throw new ProviderHttpError({
			status: last?.status ?? result.httpStatus ?? 310,
			errorClass: 'redirect_rejected',
		});
	}
	if (!last && result.httpStatus === null) {
		// No response at all: the host does not resolve.
		throw Object.assign(new Error('Host not found'), { code: 'dns_not_found' });
	}
	throw new ProviderHttpError({
		status: last?.status ?? result.httpStatus ?? 502,
		retryAfterMs: last ? parseRetryAfterMs(last.headers.get('retry-after')) : undefined,
	});
}

// Extracts the page's embedded schema.org JSON-LD — the page-native tier.
// Sites mark up events, articles, job postings, products, recipes, and more
// for search engines; that markup is deterministic field data for us.
export function createMicrodataPlugin(
	options: CreateMicrodataPluginOptions = {}
): EnrichmentPlugin {
	const fetcher = options.fetch ?? (globalThis.fetch as FetchLike);

	return defineEnrichmentPlugin({
		id: 'microdata',
		version: '1.0.0',
		runtime: 'universal',
		artifactTypes: ['microdata'],
		priority: options.priority ?? 12,
		TTL: options.TTL ?? 2_592_000,

		supports(request: EnrichmentRequest) {
			const url = getRequestUrl(request);
			return !!url && !shouldSkipUrl(url);
		},

		async enrich(request, ctx) {
			const url = getRequestUrl(request);
			if (!url || shouldSkipUrl(url)) {
				return [];
			}

			const shared = isSharedPageUrl(url)
				? await loadSharedPage({
						url,
						pages: ctx.pages,
						consumer: 'microdata',
						fetch: fetcher,
						resolveHostname: options.resolveHostname,
						mapError: toMicrodataError,
						signal: ctx.signal,
						deadlineAtMs: ctx.deadlineAtMs,
						allowLoopbackFixtures: ctx.network?.allowLoopbackFixtures,
					})
				: undefined;
			// A URL the opengraph page-source policy denies keeps this plugin's own fetch.
			const page =
				shared?.page ?? startPageFetch(url, { signal: ctx.signal, deadlineAtMs: ctx.deadlineAtMs });
			let jsonLd: ReturnType<typeof parseJsonLdBlocks>;
			let html: string;
			if (!shared) page.sink?.queued?.();
			try {
				html = (
					shared
						? readSharedHtml(shared)
						: // Paced per host like the shared fetch, and observed (WAF detection included).
							await runWithHostPolicy(new URL(url).hostname, { signal: ctx.signal }, () => {
								page.sink?.dialing?.();
								return fetchText(
									fetcher,
									url,
									{ signal: ctx.signal, headers: BROWSER_FETCH_HEADERS },
									{
										hopSink: page.sink,
										allowLoopbackFixtures: ctx.network?.allowLoopbackFixtures,
									}
								);
							})
				).slice(0, MAX_HTML_LENGTH);
				jsonLd = parseJsonLdBlocks(html);
			} catch (error) {
				page.fail(error);
				throw error;
			}
			page.finish({ usable: jsonLd.length > 0 });
			if (jsonLd.length === 0) {
				return [];
			}

			return [
				{
					artifact_type: 'microdata',
					data: microdataDataSchema.parse({
						url,
						title: readTitle(html),
						imageUrl: readPrimaryJsonLdImage(jsonLd),
						jsonLd,
					}),
					meta: {
						pluginId: 'microdata',
						provider: 'page-jsonld',
						fetchedAt: ctx.now(),
						sourceUrl: url,
					},
				},
			];
		},
	});
}
