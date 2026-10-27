import { defineProvider, ERROR_REASONS_WITHOUT_CIRCUIT, type ProviderOperationSpec } from './types';

/**
 * YouTube requests (ENG-17019). None passes a host breaker.
 *
 * - `video`: the Data API `videos.list` enrichment lookup. It is dormant without `YOUTUBE_API_KEY`
 *   (like TMDB): a keyless process makes no request and records nothing. A 403 (revoked key,
 *   exhausted quota) and a 400 whose Google reason is `API_KEY_INVALID` or `API_KEY_EXPIRED`
 *   (observed live) are `auth_failed`; any other 400 is `http_4xx`. An empty
 *   `items` answers 200 and is a `miss`. The engine's artifact cache stands in for a whole run, so a
 *   cached run is a `hit` and a cached empty result a `miss`.
 * - `classify_oembed`: the public, unauthenticated oEmbed lookup made by the classification
 *   domain stage. It is a separate operation from the enrichment `oembed|youtube` because the api
 *   runs both for one paste. It has no cache source: the classification resolver cache is not
 *   provider-observed.
 */
const operation = (overrides: Partial<ProviderOperationSpec> = {}): ProviderOperationSpec => ({
	scopes: ['api', 'enrichment'],
	liveOutcomes: ['hit', 'miss'],
	errorReasons: ERROR_REASONS_WITHOUT_CIRCUIT,
	cacheOutcomes: [],
	...overrides,
});

export const youtubeProvider = defineProvider({
	provider: 'youtube',
	operations: {
		video: operation({
			errorReasons: [...ERROR_REASONS_WITHOUT_CIRCUIT, 'auth_failed'],
			cacheOutcomes: ['hit', 'miss'],
		}),
		classify_oembed: operation({ scopes: ['api', 'classification'] }),
	},
	circuitHosts: [],
});
