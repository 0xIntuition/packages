import type { ProviderMetricsScope } from './provider-registry';

/**
 * The pinned series counts of provider metrics contract "1", per scope. This is
 * the ONLY place the counts are written down: the contract, api (unit and
 * integration), worker (metrics and entry) and trpc tests all import it, so a
 * change in cardinality is one deliberate edit with a reviewer-visible diff,
 * never six scattered numbers.
 *
 * The numbers are literals on purpose. Deriving them from the registry would make the
 * check circular: a provider added or an outcome widened would silently move the
 * expectation with it.
 */
export type ExpectedScopeSeries = {
	/** `intuition_provider_requests_total` series pre-registered at 0. */
	requests: number;
	/** `(provider, operation)` duration histograms. */
	durationHistograms: number;
	/** `intuition_provider_resolutions_total` series. */
	resolutions: number;
	/** `intuition_provider_circuit_open` series. */
	circuitGauges: number;
	/** `intuition_provider_instrumentation_info` series. */
	info: number;
	/** `intuition_provider_events_dropped_total` series (one per dropped family). */
	dropped: number;
	/** Request series per `provider|operation`; sums to `requests`. */
	operations: Readonly<Record<string, number>>;
};

export const EXPECTED_PROVIDER_SERIES = {
	api: {
		requests: 435,
		durationHistograms: 35,
		resolutions: 25,
		circuitGauges: 1,
		info: 1,
		dropped: 2,
		operations: {
			'openlibrary|search_goodreads_id': 14,
			'openlibrary|search_isbn': 14,
			'openlibrary|search_title': 16,
			'openlibrary|work': 12,
			'openlibrary|editions': 11,
			'openlibrary|book': 12,
			'openlibrary|isbn': 12,
			'openlibrary|author': 11,
			'goodreads|page': 12,
			'musicbrainz|recording': 14,
			'musicbrainz|isrc': 14,
			'musicbrainz|search': 14,
			'apple-music|lookup': 12,
			'apple-music|search': 13,
			'apple-music|podcast_search': 12,
			'spotify|token': 10,
			'spotify|item': 12,
			'spotify|classify_item': 11,
			'spotify|isrc_search': 13,
			'spotify|oembed': 11,
			'youtube|video': 13,
			'youtube|classify_oembed': 10,
			'oembed|youtube': 11,
			'oembed|vimeo': 11,
			'oembed|twitter': 11,
			'tmdb|details': 13,
			'tmdb|find': 11,
			'web|page': 14,
			'wikidata|search': 14,
			'wikidata|entity': 14,
			'wikidata|classify_entity': 11,
			'wikidata|bridge_search': 13,
			'wikidata|bridge_entity': 14,
			'wikipedia|summary': 14,
			'wikipedia|classify_summary': 11,
		},
	},
	classification: {
		requests: 108,
		durationHistograms: 9,
		resolutions: 0,
		circuitGauges: 1,
		info: 1,
		dropped: 2,
		operations: {
			'openlibrary|search_goodreads_id': 14,
			'openlibrary|search_isbn': 14,
			'openlibrary|search_title': 16,
			'spotify|token': 10,
			'spotify|classify_item': 11,
			'youtube|classify_oembed': 10,
			'tmdb|find': 11,
			'wikidata|classify_entity': 11,
			'wikipedia|classify_summary': 11,
		},
	},
	enrichment: {
		requests: 310,
		durationHistograms: 25,
		resolutions: 0,
		circuitGauges: 0,
		info: 1,
		dropped: 2,
		operations: {
			'openlibrary|work': 12,
			'openlibrary|editions': 11,
			'openlibrary|book': 12,
			'openlibrary|isbn': 12,
			'openlibrary|author': 11,
			'goodreads|page': 12,
			'musicbrainz|recording': 14,
			'musicbrainz|isrc': 14,
			'musicbrainz|search': 14,
			'apple-music|lookup': 12,
			'apple-music|search': 13,
			'apple-music|podcast_search': 12,
			'spotify|token': 10,
			'spotify|item': 12,
			'spotify|isrc_search': 13,
			'spotify|oembed': 11,
			'youtube|video': 13,
			'oembed|youtube': 11,
			'oembed|vimeo': 11,
			'oembed|twitter': 11,
			'tmdb|details': 13,
			'web|page': 14,
			'wikidata|search': 14,
			'wikidata|entity': 14,
			'wikipedia|summary': 14,
		},
	},
} as const satisfies Record<ProviderMetricsScope, ExpectedScopeSeries>;

/** Resolution series on the api: `preview` and `attach_verify` sum to the api total. */
export const EXPECTED_RESOLUTION_SERIES = { preview: 20, attach_verify: 5 } as const;

/** One histogram exposes a line per bucket bound (9) plus `+Inf`. */
export const EXPECTED_BUCKET_LINES_PER_HISTOGRAM = 10;

/** `_bucket` lines a scope exposes for its duration histograms. */
export function expectedDurationBucketLines(scope: ProviderMetricsScope): number {
	return EXPECTED_PROVIDER_SERIES[scope].durationHistograms * EXPECTED_BUCKET_LINES_PER_HISTOGRAM;
}

/**
 * The `provider|operation` pairs whose registry entry accepts `auth_failed`, in registry order.
 * A pair belongs here only if some status (or error kind) of that provider really maps to it:
 * the registry cannot check that, so adding the reason to an operation is a deliberate edit here
 * too, reviewed together with the provider's `statusOutcomes`.
 */
export const EXPECTED_AUTH_FAILED_OPERATIONS: readonly string[] = [
	'musicbrainz|recording',
	'musicbrainz|isrc',
	'musicbrainz|search',
	'spotify|token',
	'spotify|item',
	'spotify|classify_item',
	'spotify|isrc_search',
	'youtube|video',
	'tmdb|details',
	'tmdb|find',
	'wikidata|search',
	'wikidata|entity',
	'wikidata|classify_entity',
	'wikidata|bridge_search',
	'wikidata|bridge_entity',
	'wikipedia|summary',
	'wikipedia|classify_summary',
];
