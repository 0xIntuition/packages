export type { FetchLike } from './__shared__';
/** Trusted transport seam for fixtures that must observe pinned provider dials. */
export {
	createPinAwareFetch,
	PROVIDER_HTTP_BODY_EXCERPT_MAX_CHARS,
	ProviderHttpError,
	parseRetryAfterMs,
} from './__shared__/http';
export {
	createAppleMusicPlugin,
	normalizeSongMatchText,
	parseAppleMusicUrl,
	SONG_DURATION_TOLERANCE_MS,
	songDurationsMatch,
	songTextsMatch,
} from './apple-music';
export { createBrandPlugin } from './brand';
export { createCoinGeckoPlugin } from './coingecko';
export { createCrossrefPlugin } from './crossref';
export { createEtherscanPlugin } from './etherscan';
export { createFaviconPlugin } from './favicon';
export { createGitHubPlugin } from './github';
export { createLetterboxdPlugin, letterboxdDataSchema } from './letterboxd';
export { createMicrodataPlugin, flattenJsonLdNodes, parseJsonLdBlocks } from './microdata';
export { createMusicBrainzPlugin } from './musicbrainz';
export { createNpmPlugin } from './npm';
export { createOEmbedPlugin } from './oembed';
export { createOpenGraphPlugin } from './opengraph';
export type {
	OpenGraphFetchOptions,
	OpenGraphFetchResult,
	OpenGraphMetadata,
	OpenGraphTerminalStatus,
} from './opengraph/fetch';
export {
	fetchOpenGraphMetadata,
	OpenGraphFetchError,
	parseOpenGraphHead,
} from './opengraph/fetch';
export {
	buildOpenLibraryWorkArtifactFromDump,
	createOpenLibraryPlugin,
	type OpenLibraryDumpAuthor,
	type OpenLibraryDumpHydrationPayload,
	parseOpenLibraryTargetFromUrl,
	selectBestOpenLibraryCoverEdition,
} from './openlibrary';
export { createPlacesPlugin, parseMapsUrl } from './places';
export {
	createPodcastIndexPlugin,
	parsePodcastIndexUrl,
	resolvePodcastIndexTarget,
} from './podcast-index';
export { createProductListingPlugin } from './product-listing';
export { createSpotifyPlugin } from './spotify';
export { createSteamPlugin, parseSteamAppIdFromUrl } from './steam';
export { createTmdbPlugin } from './tmdb';
export { createTvmazePlugin, tvmazeDataSchema, tvmazeShowResponseSchema } from './tvmaze';
export { createWikidataPlugin } from './wikidata';
export { createWikipediaPlugin } from './wikipedia';
export { createXProfilePlugin } from './x-profile';
export { createYouTubePlugin } from './youtube';
