import { defineOperation, defineProvider } from './types';

/**
 * The licensed TMDB v3 API (ENG-17018). It needs a key, which TMDB can refuse (401), so
 * `auth_failed` is a valid reason. No request passes a host breaker, and no operation here
 * names the API host: the executable-TMDB-host guard allows that only on its own allowlist.
 *
 * Producer semantics, per operation:
 * - `details`: the enrichment `/movie/{id}` or `/tv/{id}` lookup. The enrichment scope
 *   (kg-enrichment-worker) and the api (enrichment during create) record it. 404 is a miss
 *   (a withdrawn or unknown id), 401 is `auth_failed`, and a payload whose id is not the
 *   requested one is `invalid_response`. The plugin is dormant without `TMDB_API_KEY`: no key,
 *   no request, no event. The engine's artifact cache (TTL 43,200 s) absorbs a repeat run, which
 *   stands in for the one lookup it would have made: a `hit` (artifact) or a `miss` (cached 404).
 * - `find`: the classification IMDb-to-TMDB `/find` bridge (the api records it for previews, the
 *   classification worker for classification). It is a separate operation from `details`
 *   because the api runs both for one IMDb paste. No hits is a miss; the user-facing `unavailable`
 *   fallback is unchanged. The classification resolver cache is not provider-observed, so it has
 *   no cache source.
 *
 * A future `search` (api) is deliberately not registered: the passthrough provider search opts
 * in when it lands.
 */
export const tmdbProvider = defineProvider({
	provider: 'tmdb',
	operations: {
		details: defineOperation({ cacheOutcomes: ['hit', 'miss'] }),
		find: defineOperation({ scopes: ['api', 'classification'] }),
	},
	circuitHosts: [],
});
