import { defineOperation, defineProvider, ERROR_REASONS_WITHOUT_CIRCUIT } from './types';

/**
 * Spotify Web API requests made through the shared client (ENG-16978). Each HTTP request is one
 * event, so a 401 refresh records two `token` and two lookup events. None passes a host breaker,
 * and Spotify can refuse our credentials, so `auth_failed` is a valid reason.
 *
 * Producer semantics, per operation:
 * - `token`: the client-credentials mint, shared by classification and enrichment. One event per
 *   token HTTP request, from whichever producer (scope) ran it; a cached token records nothing.
 * - `item`: the enrichment lookup of a track, album, artist, playlist, show or episode. The
 *   enrichment scope (kg-enrichment-worker) and the api (enrichment during create) record it.
 * - `classify_item`: the same Spotify call made by the classification domain-api stage. The
 *   classification worker and the api (classification previews) record it. It is a separate
 *   operation from `item` because the api runs both for one paste: one operation would count
 *   one lookup twice and skew the fallback share (one fallback plus one success reads 33%).
 * - `isrc_search`: the enrichment ISRC fallback search. An empty result is a miss.
 * - `oembed`: the public, unauthenticated oEmbed lookup.
 *
 * Cache series (`source=cache`): the engine's artifact cache (TTL 900 s) absorbs a whole enrichment
 * run, so a cached run stands in for the one lookup it would have made: `item` (a Web API lookup;
 * the plugin always falls back to a URL artifact, so a cached run is only ever a hit; the engine sees
 * only an artifact count, so a cached run whose artifact came from the oEmbed/URL fallback is
 * still recorded as an `item` hit with credentials),
 * `isrc_search` (a cached empty search is a miss) or, without credentials, `oembed`. `token` and
 * `classify_item` have no cache source: the token is cached inside the client and records
 * nothing, and the classification resolver cache is not provider-observed.
 */
export const spotifyProvider = defineProvider({
	provider: 'spotify',
	operations: {
		// The client-credentials grant: a token is minted or it is not, never "not found".
		token: defineOperation({
			scopes: ['api', 'classification', 'enrichment'],
			liveOutcomes: ['hit'],
		}),
		// The enrichment lookup, and the classification domain-api lookup recorded apart from it.
		item: defineOperation({ scopes: ['api', 'enrichment'], cacheOutcomes: ['hit'] }),
		classify_item: defineOperation({ scopes: ['api', 'classification'] }),
		isrc_search: defineOperation({ cacheOutcomes: ['hit', 'miss'] }),
		// The public oEmbed endpoint is unauthenticated.
		oembed: defineOperation({
			errorReasons: ERROR_REASONS_WITHOUT_CIRCUIT,
			cacheOutcomes: ['hit'],
		}),
	},
	circuitHosts: [],
});
