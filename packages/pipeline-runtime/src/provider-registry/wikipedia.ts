import { defineOperation, defineProvider } from './types';

/**
 * Wikipedia REST summary requests (ENG-17015). A 404 (no such page) is a miss; Wikimedia refuses a
 * request without a descriptive User-Agent with 403 (`auth_failed`) and throttles with 429
 * (`rate_limited`). It is paced by the shared Wikimedia slot: `budget_exhausted` is that slot refusing
 * the request or the deadline arriving before it was dialled (no duration, our own backpressure). The EntityData lookup the Wikipedia plugin makes for type agreement is
 * `wikidata|entity`, not a Wikipedia operation. No breaker, no budget.
 *
 * - `summary`: the enrichment summary fetch. The engine's artifact cache (TTL 43200 s) can absorb
 *   a run: hit with an artifact, miss for a cached empty result.
 * - `classify_summary`: the same call made by the classification domain-api stage (separate from
 *   `summary` because the api runs both for one paste). No cache source.
 */
export const wikipediaProvider = defineProvider({
	provider: 'wikipedia',
	operations: {
		summary: defineOperation({
			liveOutcomes: ['hit', 'miss', 'budget_exhausted'],
			cacheOutcomes: ['hit', 'miss'],
		}),
		classify_summary: defineOperation({ scopes: ['api', 'classification'] }),
	},
	circuitHosts: [],
});
