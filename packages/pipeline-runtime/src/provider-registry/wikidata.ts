import { defineOperation, defineProvider, ERROR_REASONS_WITH_AUTH } from './types';

/**
 * Wikidata requests made by enrichment, classification and the api identity bridge (ENG-17015,
 * ENG-17016). Wikimedia refuses a request
 * without a descriptive User-Agent with 403 (`auth_failed`), answers its throttle with 429 and a
 * replication-lag refusal (`maxlag`) with HTTP 200 and an `{error}` body plus `Retry-After`; both
 * are `rate_limited`. A 404 (no such entity) and an empty search are misses. No host breaker, and the
 * enrichment/classification calls hold no budget. Every operation that takes the shared Wikimedia
 * request slot (`getWikimediaRequestSlot()`: `search`, `entity`, `bridge_search`, `bridge_entity`)
 * reports `budget_exhausted` when the slot refuses the request (queue full, or it cannot start before
 * the deadline) or the deadline arrives before the request was dialled: local backpressure, nothing
 * was dialled, no duration, and it says nothing about Wikimedia (a real 429 / maxlag stays
 * `rate_limited`). `classify_entity` does not use the slot.
 *
 * Producer semantics, per operation:
 * - `search`: the enrichment `wbsearchentities` title search. A 200 whose body is an error is an
 *   error, never an empty result.
 * - `entity`: the `Special:EntityData` fetch of the Wikidata and Wikipedia enrichment plugins
 *   (one operation for both, since it is the same call). A 404 or a missing entity is a miss.
 * - `classify_entity`: the same EntityData call made by the classification domain-api stage. The
 *   classification worker and the api (classification previews) record it. A separate operation
 *   from `entity` because the api runs both for one paste.
 *
 * - `bridge_search`: the api identity bridge's CirrusSearch `haswbstatement` query (paste-time
 *   mapping of a Spotify, TMDB or IMDb id to a Wikidata item). Zero or several hits are a miss.
 * - `bridge_entity`: the bridge's EntityData fetch of the single hit. A hit is an item that really
 *   owns the id with the expected P31 type; a disambiguation page, a P31 mismatch, a missing claim
 *   and a 404 are misses. Both bridge operations are api-only: the bridge also runs in
 *   atom-services, whose calls are not counted until that scope exists (ENG-16986). `timeout` is the
 *   bridge's own deadline (3 s, 1 s for Spotify) firing during a request; a caller leaving records
 *   nothing.
 *
 * Cache series (`source=cache`): the engine's artifact cache (TTL 43200 s) absorbs a whole
 * enrichment run, so a cached run stands in for the one lookup it would have made: `entity` for a
 * request that carries an entity id, `search` for a title-only request (hit with an artifact, miss
 * for a cached empty result). `classify_entity` has no cache source. The bridge answers a repeat
 * lookup of the same property and value from its own cache (5 min for a hit, 30 s for a miss), or
 * joins an identical lookup already in flight; the answer stands in for the hop that produced it
 * (`bridge_search|miss`, `bridge_entity|hit` / `|miss`). A cached failure (the retry-backoff window)
 * is the request's own error and records nothing.
 */
export const wikidataProvider = defineProvider({
	provider: 'wikidata',
	operations: {
		search: defineOperation({
			liveOutcomes: ['hit', 'miss', 'budget_exhausted'],
			cacheOutcomes: ['hit', 'miss'],
		}),
		entity: defineOperation({
			liveOutcomes: ['hit', 'miss', 'budget_exhausted'],
			cacheOutcomes: ['hit', 'miss'],
		}),
		classify_entity: defineOperation({ scopes: ['api', 'classification'] }),
		bridge_search: defineOperation({
			scopes: ['api'],
			liveOutcomes: ['hit', 'miss', 'budget_exhausted'],
			errorReasons: ERROR_REASONS_WITH_AUTH,
			cacheOutcomes: ['miss'],
		}),
		bridge_entity: defineOperation({
			scopes: ['api'],
			liveOutcomes: ['hit', 'miss', 'budget_exhausted'],
			errorReasons: ERROR_REASONS_WITH_AUTH,
			cacheOutcomes: ['hit', 'miss'],
		}),
	},
	circuitHosts: [],
});
