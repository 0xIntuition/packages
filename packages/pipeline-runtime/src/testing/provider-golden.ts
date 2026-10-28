import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { ProviderMetricsScope } from '../provider-metrics-contract';
import type {
	ProviderOutcome,
	ProviderReason,
	ProviderRequestEvent,
	ProviderResolutionEvent,
	ProviderSource,
} from '../provider-observer';
import type { ProviderName, ProviderOperationOf } from '../provider-registry';

/**
 * Golden `/metrics` snapshots for the provider families (ENG-16976). Each scope
 * (api, classification worker, enrichment worker) renders the same deterministic
 * traffic below, and the exposition is compared byte for byte with the committed
 * file. A refactor of the registry or the observers must leave the files
 * untouched; adding a series is a deliberate, reviewer-visible edit of the file
 * (regenerate with `UPDATE_PROVIDER_GOLDEN=1`).
 *
 * The traffic names its providers and operations literally and imports only
 * registry TYPES (erased at runtime), so a registry change cannot silently rewrite the
 * input: a renamed operation stops compiling instead.
 */

const SEARCH = ['search_goodreads_id', 'search_isbn', 'search_title'] as const;
const ENRICHMENT = ['work', 'editions', 'book', 'isbn', 'author'] as const;

/**
 * A request event for a valid `(provider, operation)` pair: the generics check the pair, the
 * single cast only reunites it with the event union, which TypeScript cannot correlate.
 */
function request<P extends ProviderName>(
	provider: P,
	operation: ProviderOperationOf<P>,
	outcome: ProviderOutcome,
	reason: ProviderReason,
	source: ProviderSource,
	durationMs?: number
): ProviderRequestEvent {
	return {
		type: 'provider_request',
		provider,
		operation,
		outcome,
		reason,
		source,
		...(durationMs === undefined ? {} : { durationMs }),
	} as ProviderRequestEvent;
}

const openLibrary = (
	operation: ProviderOperationOf<'openlibrary'>,
	outcome: ProviderOutcome,
	reason: ProviderReason,
	source: ProviderSource,
	durationMs?: number
) => request('openlibrary', operation, outcome, reason, source, durationMs);

function searchTraffic(operation: (typeof SEARCH)[number]): ProviderRequestEvent[] {
	return [
		openLibrary(operation, 'hit', 'none', 'live', 120),
		openLibrary(operation, 'hit', 'none', 'live', 480),
		openLibrary(operation, 'miss', 'none', 'live', 90),
		// A budget miss never dialled, so it carries no duration (as the real producer emits it).
		openLibrary(operation, 'budget_exhausted', 'none', 'live'),
		openLibrary(operation, 'error', 'timeout', 'live', 5000),
		openLibrary(operation, 'error', 'circuit_open', 'live'),
		openLibrary(operation, 'hit', 'none', 'cache'),
		openLibrary(operation, 'miss', 'none', 'cache'),
		...(operation === 'search_title'
			? [
					openLibrary(operation, 'ambiguous', 'none', 'live', 700),
					openLibrary(operation, 'ambiguous', 'none', 'cache'),
				]
			: []),
	];
}

function enrichmentTraffic(operation: (typeof ENRICHMENT)[number]): ProviderRequestEvent[] {
	return [
		openLibrary(operation, 'hit', 'none', 'live', 80),
		openLibrary(operation, 'hit', 'none', 'live', 2200),
		openLibrary(operation, 'miss', 'none', 'live', 60),
		// Our own pacing slot refused it (ENG-17085): nothing dialled, no duration.
		openLibrary(operation, 'budget_exhausted', 'none', 'live'),
		openLibrary(operation, 'error', 'rate_limited', 'live', 150),
		openLibrary(operation, 'error', 'upstream_5xx', 'live', 900),
		openLibrary(operation, 'error', 'invalid_response', 'live', 70),
		// An enrichment fetch passes no breaker, so `circuit_open` is not one of its reasons:
		// the contract normalizes it to `other` rather than dropping the event.
		openLibrary(operation, 'error', 'circuit_open', 'live', 10),
	];
}

const pageTraffic = (): ProviderRequestEvent[] => [
	request('goodreads', 'page', 'hit', 'none', 'live', 600),
	request('goodreads', 'page', 'miss', 'none', 'live', 300),
	request('goodreads', 'page', 'error', 'blocked', 'live', 200),
	// The second plugin of a run reuses the first one's fetch (ENG-16980): a hit or a miss, no duration.
	request('goodreads', 'page', 'hit', 'none', 'cache'),
	request('goodreads', 'page', 'miss', 'none', 'cache'),
	// Every other page (ENG-17017): same shape, a fixed set of series with no host label.
	request('web', 'page', 'hit', 'none', 'live', 450),
	request('web', 'page', 'hit', 'no_metadata', 'live', 380),
	request('web', 'page', 'miss', 'dead_url', 'live', 120),
	request('web', 'page', 'error', 'blocked', 'live', 220),
	request('web', 'page', 'hit', 'none', 'cache'),
	request('web', 'page', 'miss', 'none', 'cache'),
];

const MUSICBRAINZ = ['recording', 'isrc', 'search'] as const;

function musicBrainzTraffic(operation: (typeof MUSICBRAINZ)[number]): ProviderRequestEvent[] {
	return [
		request('musicbrainz', operation, 'hit', 'none', 'live', 250),
		request('musicbrainz', operation, 'miss', 'none', 'live', 90),
		// Our own pacing slot refused it (ENG-17085): nothing dialled, no duration.
		request('musicbrainz', operation, 'budget_exhausted', 'none', 'live'),
		request('musicbrainz', operation, 'error', 'rate_limited', 'live', 120),
		request('musicbrainz', operation, 'error', 'auth_failed', 'live', 60),
		request('musicbrainz', operation, 'error', 'upstream_5xx', 'live', 800),
		// Not valid for a single MusicBrainz request: an unknown reason collapses to `other`.
		request('musicbrainz', operation, 'error', 'circuit_open', 'live', 10),
		request('musicbrainz', operation, 'hit', 'none', 'cache'),
		request('musicbrainz', operation, 'miss', 'none', 'cache'),
	];
}
const appleMusicTraffic = (): ProviderRequestEvent[] => [
	request('apple-music', 'lookup', 'hit', 'none', 'live', 210),
	request('apple-music', 'lookup', 'miss', 'none', 'live', 150),
	request('apple-music', 'lookup', 'error', 'http_4xx', 'live', 90),
	// The engine's artifact cache standing in for a lookup (a cached empty result is a miss).
	request('apple-music', 'lookup', 'hit', 'none', 'cache'),
	request('apple-music', 'lookup', 'miss', 'none', 'cache'),
	request('apple-music', 'search', 'hit', 'none', 'live', 340),
	request('apple-music', 'search', 'miss', 'none', 'live', 280),
	request('apple-music', 'search', 'error', 'rate_limited', 'live', 120),
	request('apple-music', 'podcast_search', 'hit', 'none', 'live', 300),
	request('apple-music', 'podcast_search', 'error', 'upstream_5xx', 'live', 800),
];

/**
 * The track-preview resolver's own events (negative cache, gate rejection): only
 * the api process runs the resolver.
 */
const appleMusicCacheTraffic = (): ProviderRequestEvent[] => [
	request('apple-music', 'search', 'miss', 'none', 'cache'),
	request('apple-music', 'search', 'miss', 'none', 'cache'),
	request('apple-music', 'search', 'budget_exhausted', 'none', 'live'),
];

/** The token mint runs in every scope. */
const spotifyTokenTraffic = (): ProviderRequestEvent[] => [
	request('spotify', 'token', 'hit', 'none', 'live', 150),
	request('spotify', 'token', 'error', 'auth_failed', 'live', 90),
	request('spotify', 'token', 'error', 'rate_limited', 'live', 60),
	request('spotify', 'token', 'error', 'timeout', 'live', 5000),
];

/** The same lookup under the operation of its producer: `item` (enrichment) or `classify_item`. */
const spotifyLookupTraffic = (operation: 'item' | 'classify_item'): ProviderRequestEvent[] => [
	request('spotify', operation, 'hit', 'none', 'live', 220),
	request('spotify', operation, 'miss', 'none', 'live', 130),
	request('spotify', operation, 'error', 'auth_failed', 'live', 80),
	request('spotify', operation, 'error', 'upstream_5xx', 'live', 900),
	// The engine's artifact cache serves a whole enrichment run: only `item` has cache series.
	...(operation === 'item' ? [request('spotify', operation, 'hit', 'none', 'cache')] : []),
];

const spotifyEnrichmentTraffic = (): ProviderRequestEvent[] => [
	request('spotify', 'isrc_search', 'hit', 'none', 'live', 300),
	request('spotify', 'isrc_search', 'miss', 'none', 'live', 250),
	request('spotify', 'isrc_search', 'error', 'auth_failed', 'live', 70),
	request('spotify', 'isrc_search', 'hit', 'none', 'cache'),
	request('spotify', 'isrc_search', 'miss', 'none', 'cache'),
	request('spotify', 'oembed', 'hit', 'none', 'live', 140),
	request('spotify', 'oembed', 'miss', 'none', 'live', 100),
	request('spotify', 'oembed', 'hit', 'none', 'cache'),
	// oEmbed takes no credentials: auth_failed is not valid there and collapses to other.
	request('spotify', 'oembed', 'error', 'auth_failed', 'live', 50),
];

/**
 * Wikidata and Wikipedia (ENG-17015). The enrichment lookups (`wikidata|search`, `wikidata|entity`,
 * `wikipedia|summary`) have cache series; the classification stage's own operations
 * (`classify_entity`, `classify_summary`) do not.
 */
const wikimediaEnrichmentTraffic = (): ProviderRequestEvent[] =>
	(
		[
			['wikidata', 'search'],
			['wikidata', 'entity'],
			['wikipedia', 'summary'],
		] as const
	).flatMap(([provider, operation]) => [
		request(provider, operation, 'hit', 'none', 'live', 180),
		request(provider, operation, 'miss', 'none', 'live', 110),
		// The shared Wikimedia slot refused it (ENG-17085): nothing dialled, no duration.
		request(provider, operation, 'budget_exhausted', 'none', 'live'),
		request(provider, operation, 'error', 'rate_limited', 'live', 90),
		request(provider, operation, 'error', 'auth_failed', 'live', 40),
		request(provider, operation, 'error', 'invalid_response', 'live', 70),
		request(provider, operation, 'hit', 'none', 'cache'),
		request(provider, operation, 'miss', 'none', 'cache'),
	]);

/** The api identity bridge (ENG-17016): api only; its cache series stand in for a repeat lookup. */
const wikidataBridgeTraffic = (): ProviderRequestEvent[] => [
	request('wikidata', 'bridge_search', 'hit', 'none', 'live', 240),
	request('wikidata', 'bridge_search', 'miss', 'none', 'live', 180),
	request('wikidata', 'bridge_search', 'budget_exhausted', 'none', 'live'),
	request('wikidata', 'bridge_search', 'error', 'rate_limited', 'live', 90),
	request('wikidata', 'bridge_search', 'error', 'timeout', 'live', 1000),
	request('wikidata', 'bridge_search', 'miss', 'none', 'cache'),
	request('wikidata', 'bridge_entity', 'hit', 'none', 'live', 420),
	request('wikidata', 'bridge_entity', 'miss', 'none', 'live', 380),
	request('wikidata', 'bridge_entity', 'error', 'upstream_5xx', 'live', 700),
	request('wikidata', 'bridge_entity', 'hit', 'none', 'cache'),
	request('wikidata', 'bridge_entity', 'miss', 'none', 'cache'),
];

const wikimediaClassificationTraffic = (): ProviderRequestEvent[] => [
	request('wikidata', 'classify_entity', 'hit', 'none', 'live', 200),
	request('wikidata', 'classify_entity', 'miss', 'none', 'live', 120),
	request('wikidata', 'classify_entity', 'error', 'rate_limited', 'live', 80),
	request('wikidata', 'classify_entity', 'error', 'auth_failed', 'live', 45),
	request('wikipedia', 'classify_summary', 'hit', 'none', 'live', 160),
	request('wikipedia', 'classify_summary', 'miss', 'none', 'live', 100),
	request('wikipedia', 'classify_summary', 'error', 'upstream_5xx', 'live', 700),
];

/**
 * Events with no valid tuple in any scope: they must only move the dropped counter. The only
 * place the pairing is bypassed, on purpose.
 */
const droppedTraffic = (): ProviderRequestEvent[] =>
	[
		// A token is minted or it is not: there is no miss.
		{ provider: 'spotify', operation: 'token', outcome: 'miss', reason: 'none' },
		{ provider: 'openlibrary', operation: 'not_an_operation', outcome: 'hit', reason: 'none' },
		{ provider: 'openlibrary', operation: 'work', outcome: 'not_an_outcome', reason: 'none' },
	].map(
		(event) =>
			({
				type: 'provider_request',
				source: 'live',
				durationMs: 1,
				...event,
			}) as unknown as ProviderRequestEvent
	);

export const GOLDEN_RESOLUTIONS: readonly ProviderResolutionEvent[] = [
	{
		type: 'provider_resolution',
		input: 'goodreads',
		resolution: 'resolved',
		route: 'goodreads_id',
		quality: 'title_and_cover',
		caller: 'preview',
		goodreadsBookId: '5907',
		openLibraryWorkKey: 'OL27482W',
		candidateCount: 0,
		durationMs: 812,
		lookups: [],
	},
	{
		type: 'provider_resolution',
		input: 'goodreads',
		resolution: 'ambiguous',
		route: 'none',
		quality: 'unknown',
		caller: 'attach_verify',
		candidateCount: 3,
		durationMs: 40,
		lookups: [],
	},
];

/** The traffic one scope's exporter receives (events outside the scope are never routed to it). */
export function goldenRequestEventsForScope(scope: ProviderMetricsScope): ProviderRequestEvent[] {
	const search = SEARCH.flatMap(searchTraffic);
	const enrichment = [
		...ENRICHMENT.flatMap(enrichmentTraffic),
		...MUSICBRAINZ.flatMap(musicBrainzTraffic),
	];
	switch (scope) {
		case 'api':
			return [
				...search,
				...enrichment,
				...pageTraffic(),
				...appleMusicTraffic(),
				...appleMusicCacheTraffic(),
				...spotifyTokenTraffic(),
				...spotifyLookupTraffic('item'),
				...spotifyLookupTraffic('classify_item'),
				...spotifyEnrichmentTraffic(),
				...wikimediaEnrichmentTraffic(),
				...wikimediaClassificationTraffic(),
				...wikidataBridgeTraffic(),
				...droppedTraffic(),
			];
		case 'classification':
			return [
				...search,
				...spotifyTokenTraffic(),
				...spotifyLookupTraffic('classify_item'),
				...wikimediaClassificationTraffic(),
				...droppedTraffic(),
			];
		case 'enrichment':
			return [
				...enrichment,
				...pageTraffic(),
				...appleMusicTraffic(),
				...spotifyTokenTraffic(),
				...spotifyLookupTraffic('item'),
				...spotifyEnrichmentTraffic(),
				...wikimediaEnrichmentTraffic(),
				...droppedTraffic(),
			];
	}
}

function goldenPath(name: string): string {
	const path = fileURLToPath(new URL(`./golden/${name}.txt`, import.meta.url));
	return existsSync(path)
		? path
		: fileURLToPath(new URL(`../../src/testing/golden/${name}.txt`, import.meta.url));
}

/**
 * Returns the committed snapshot, or writes `actual` when `UPDATE_PROVIDER_GOLDEN=1`.
 * Callers compare the result with their own `expect`.
 */
export function goldenOrUpdate(name: string, actual: string): string {
	const path = goldenPath(name);
	if (process.env.UPDATE_PROVIDER_GOLDEN === '1') {
		writeFileSync(path, actual);
		return actual;
	}
	return readFileSync(path, 'utf8');
}
