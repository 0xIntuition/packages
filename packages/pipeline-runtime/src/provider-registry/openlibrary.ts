import {
	BASE_ERROR_REASONS,
	defineProvider,
	ERROR_REASONS_WITHOUT_CIRCUIT,
	type ProviderOperationSpec,
} from './types';

/** Classification lookups against `search.json`: budgeted, cached and behind the host breaker. */
const searchOperation = (
	overrides: Partial<ProviderOperationSpec> = {}
): ProviderOperationSpec => ({
	scopes: ['api', 'classification'],
	liveOutcomes: ['hit', 'miss', 'budget_exhausted'],
	errorReasons: BASE_ERROR_REASONS,
	cacheOutcomes: ['hit', 'miss'],
	...overrides,
});

/**
 * Enrichment entity fetches: single requests, no breaker and no budget of their own, paced by the
 * process slot `openlibrary`: `budget_exhausted` is that slot refusing the request or the deadline
 * arriving while it waits for its turn (nothing dialled, no duration; a real 429 is `rate_limited`). The
 * engine's artifact cache can absorb a run, so the entity fetch a run starts
 * from (work, book, isbn) has cache series; editions and author fetches only
 * ever run inside such a run and are never served from the cache themselves.
 */
const enrichmentOperation = (
	overrides: Partial<ProviderOperationSpec> = {}
): ProviderOperationSpec => ({
	scopes: ['api', 'enrichment'],
	liveOutcomes: ['hit', 'miss', 'budget_exhausted'],
	errorReasons: ERROR_REASONS_WITHOUT_CIRCUIT,
	cacheOutcomes: [],
	...overrides,
});
// The plugin always returns its book artifact or throws (a 404 is a thrown miss, which the engine
// never caches), so a cached run can only be a hit.
const cacheableEnrichmentOperation = () => enrichmentOperation({ cacheOutcomes: ['hit'] });

const searchOperations = {
	search_goodreads_id: searchOperation(),
	search_isbn: searchOperation(),
	// Only a title search can match several works.
	search_title: searchOperation({
		liveOutcomes: ['hit', 'miss', 'budget_exhausted', 'ambiguous'],
		cacheOutcomes: ['hit', 'miss', 'ambiguous'],
	}),
} as const;

const enrichmentOperations = {
	work: cacheableEnrichmentOperation(),
	editions: enrichmentOperation(),
	book: cacheableEnrichmentOperation(),
	isbn: cacheableEnrichmentOperation(),
	author: enrichmentOperation(),
} as const;

export const openLibraryProvider = defineProvider({
	provider: 'openlibrary',
	operations: { ...searchOperations, ...enrichmentOperations },
	circuitHosts: [{ host: 'openlibrary.org', scopes: ['api', 'classification'] }],
});

export type OpenLibrarySearchOperation = keyof typeof searchOperations;
export type OpenLibraryEnrichmentOperation = keyof typeof enrichmentOperations;
