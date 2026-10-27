import { defineProvider, ERROR_REASONS_WITHOUT_CIRCUIT, type ProviderOperationSpec } from './types';

/**
 * The free iTunes API (itunes.apple.com): no auth, no user agent, no shared host
 * breaker. A miss is HTTP 200 with `resultCount: 0`, never a 404.
 *
 * Every operation has a cache source: the engine's artifact cache (TTL 43,200 s) serves a
 * repeat run without dialling, and it caches an empty result too, so a cached run is a cache
 * `hit` (artifacts) or a cache `miss` (none). The plugin declares which operation a request
 * stands in for (`observability.cacheOperations`).
 */
const itunesOperation = (
	overrides: Partial<ProviderOperationSpec> = {}
): ProviderOperationSpec => ({
	scopes: ['api', 'enrichment'],
	liveOutcomes: ['hit', 'miss'],
	errorReasons: ERROR_REASONS_WITHOUT_CIRCUIT,
	cacheOutcomes: ['hit', 'miss'],
	...overrides,
});

export const appleMusicProvider = defineProvider({
	provider: 'apple-music',
	operations: {
		/** `lookup?id=` for an Apple Music or Apple Podcasts id. */
		lookup: itunesOperation(),
		/**
		 * Gated song-catalog search (`itunesSongSearch`). The track-preview resolver
		 * (api only) reports around it: a permanent negative-cache answer is a cache
		 * miss, and a resolution refused by its local admission gate is a live
		 * `budget_exhausted` (nothing dialled, no duration).
		 *
		 * `search|miss|cache` has TWO sources, both "a cache answered `no preview`
		 * without dialling": the resolver's permanent negative cache (api only) and the
		 * engine's cached empty result (api and enrichment). They are not told apart.
		 * `search|budget_exhausted` is api-only, but the registry is not scope-aware, so the
		 * enrichment scope also pre-registers it and it stays at 0 there.
		 */
		search: itunesOperation({
			liveOutcomes: ['hit', 'miss', 'budget_exhausted'],
		}),
		/** Gated podcast-catalog search (`itunesPodcastSearch`). */
		podcast_search: itunesOperation(),
	},
	circuitHosts: [],
});

export type AppleMusicOperation = keyof typeof appleMusicProvider.operations;
