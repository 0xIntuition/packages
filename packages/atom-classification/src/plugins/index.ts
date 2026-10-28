import { amazonProfile } from './amazon';
import { coingeckoProfile } from './coingecko';
import { coinmarketcapProfile } from './coinmarketcap';
import { ethereumProfile } from './etherscan';
import { etsyProfile } from './etsy';
import { githubProfile } from './github';
import { goodreadsProfile } from './goodreads';
import { imdbProfile } from './imdb';
import { instagramProfile } from './instagram';
import { intProfile } from './int';
import { isbnProfile } from './isbn';
import { letterboxdProfile } from './letterboxd';
import { lexicalProfile } from './lexical';
import { npmProfile } from './npm';
import { openLibraryProfile } from './openlibrary';
import { placesProfile } from './places';
import { plainTextProfile } from './plain-text';
import type { NonUrlV0Profile } from './shared/non-url';
import type { PlatformV0Profile } from './shared/platform';
import { shopifyProfile } from './shopify';
import { spotifyProfile } from './spotify';
import { steamProfile } from './steam';
import { tiktokProfile } from './tiktok';
import { tmdbProfile } from './tmdb';
import { wikidataProfile } from './wikidata';
import { wikipediaProfile } from './wikipedia';
import { xProfile } from './x';
import { youtubeProfile } from './youtube';

export type { AmazonPluginOptions } from './amazon';
export { createAmazonPlugin } from './amazon';
export type { AmazonCanopyPluginOptionsInput } from './amazon/canopy';
export { createAmazonCanopyPluginOptions } from './amazon/canopy';
export type {
	AmazonDomainApiAdapter,
	AmazonDomainApiAdapterOptions,
} from './amazon/domain-api-adapter';
export { createAmazonDomainApiAdapter } from './amazon/domain-api-adapter';
export type {
	AmazonDomainHtmlAdapter,
	AmazonDomainHtmlAdapterOptions,
} from './amazon/domain-html-adapter';
export { createAmazonDomainHtmlAdapter } from './amazon/domain-html-adapter';
export { createCoinGeckoPlugin } from './coingecko';
export { createCoinMarketCapPlugin } from './coinmarketcap';
export type { DefaultUrlPluginOptions } from './default-url';
export { createDefaultUrlPlugin } from './default-url';
export type { EtherscanPluginOptions } from './etherscan';
export { createEthereumPlugin, createEtherscanPlugin } from './etherscan';
export { createEtsyPlugin } from './etsy';
export type { GitHubPluginOptions } from './github';
export { createGitHubPlugin } from './github';
export type {
	GitHubDomainApiAdapter,
	GitHubDomainApiAdapterOptions,
} from './github/domain-api-adapter';
export { createGitHubDomainApiAdapter } from './github/domain-api-adapter';
export type { GoodreadsBlockedOutcome, GoodreadsPluginOptions } from './goodreads';
export {
	createGoodreadsPlugin,
	GOODREADS_BLOCKED_MESSAGE,
	resolveGoodreadsBlockedOutcome,
} from './goodreads';
export type {
	GoodreadsOpenGraphAdapter,
	GoodreadsOpenGraphAdapterOptions,
} from './goodreads/opengraph-adapter';
export { createGoodreadsOpenGraphAdapter } from './goodreads/opengraph-adapter';
export type {
	GoodreadsOpenLibraryAdapter,
	GoodreadsOpenLibraryAdapterOptions,
} from './goodreads/openlibrary-adapter';
export { createGoodreadsOpenLibraryAdapter } from './goodreads/openlibrary-adapter';
export { parseGoodreadsBookUrl } from './goodreads/url';
export type { ImdbPluginOptions } from './imdb';
export { createImdbPlugin } from './imdb';
export type {
	ImdbDomainHtmlAdapter,
	ImdbDomainHtmlAdapterOptions,
} from './imdb/domain-html-adapter';
export { createImdbDomainHtmlAdapter } from './imdb/domain-html-adapter';
export type { InstagramPluginOptions } from './instagram';
export { createInstagramPlugin } from './instagram';
export type {
	InstagramOpenGraphAdapter,
	InstagramOpenGraphAdapterOptions,
} from './instagram/opengraph-adapter';
export { createInstagramOpenGraphAdapter } from './instagram/opengraph-adapter';
export { createIntuitionIdPlugin } from './int';
export type { IsbnPluginOptions } from './isbn';
export { createIsbnPlugin } from './isbn';
export type { LetterboxdPluginOptions } from './letterboxd';
export {
	createLetterboxdDomainHtmlAdapter,
	createLetterboxdOpenGraphAdapter,
	createLetterboxdPlugin,
	letterboxdProfile,
	parseLetterboxdUrl,
} from './letterboxd';
export type {
	LetterboxdDomainHtmlAdapter,
	LetterboxdDomainHtmlAdapterOptions,
} from './letterboxd/domain-html-adapter';
export type {
	LetterboxdOpenGraphAdapter,
	LetterboxdOpenGraphAdapterOptions,
} from './letterboxd/opengraph-adapter';
export { createLexicalPlugin } from './lexical';
export type { NpmPluginOptions } from './npm';
export { createNpmPlugin } from './npm';
export type { OpenLibraryPluginOptions } from './openlibrary';
export { createOpenLibraryPlugin } from './openlibrary';
export type { PlacesPluginOptions } from './places';
export { createPlacesPlugin } from './places';
export type {
	PlacesOpenGraphAdapter,
	PlacesOpenGraphAdapterOptions,
} from './places/opengraph-adapter';
export { createPlacesOpenGraphAdapter } from './places/opengraph-adapter';
export { createPlainTextPlugin } from './plain-text';
export { getDomainHtmlHostCircuitOpen } from './shared/domain-html/fetch';
export type { NonUrlV0Profile } from './shared/non-url';
export type {
	OpenGraphMetadata,
	OpenGraphPlatformAdapter,
	OpenGraphPlatformAdapterInput,
	OpenGraphPlatformAdapterOptions,
} from './shared/opengraph';
export { createOpenGraphPlatformAdapter } from './shared/opengraph';
export type {
	OpenLibraryWorkLookupHit,
	OpenLibraryWorkLookupOptions,
	OpenLibraryWorkLookupQuery,
	OpenLibraryWorkLookupResult,
} from './shared/openlibrary-lookup';
export { resolveOpenLibraryWork } from './shared/openlibrary-lookup';
export type { PlatformDomain, PlatformV0PluginOptions, PlatformV0Profile } from './shared/platform';
export type {
	PublicMetadataPlatformAdapter,
	PublicMetadataPlatformAdapterOptions,
	PublicMetadataSource,
	PublicMetadataSourceResult,
} from './shared/public-metadata';
export { createPublicMetadataPlatformAdapter } from './shared/public-metadata';
export { createShopifyPlugin } from './shopify';
export type {
	SpotifyDomainApiAdapter,
	SpotifyDomainApiAdapterOptions,
	SpotifyPluginOptions,
} from './spotify';
export { createSpotifyDomainApiAdapter, createSpotifyPlugin } from './spotify';
export type { SteamPluginOptions } from './steam';
export { createSteamPlugin } from './steam';
export type { TikTokPluginOptions } from './tiktok';
export { createTikTokPlugin } from './tiktok';
export type { TmdbPluginOptions } from './tmdb';
export { createTmdbPlugin } from './tmdb';
export { createTypeProfilesPlugin, createV0TypeProfilesPlugin } from './type-profiles';
export type { WikidataPluginOptions } from './wikidata';
export { createWikidataPlugin } from './wikidata';
export type {
	WikipediaDomainApiAdapter,
	WikipediaDomainApiAdapterOptions,
	WikipediaPluginOptions,
	WikipediaSchemaType,
	WikipediaTypeInference,
	WikipediaTypingEvidence,
} from './wikipedia';
export {
	createWikipediaDomainApiAdapter,
	createWikipediaPlugin,
	inferWikipediaTypeFromEvidence,
	WIKIPEDIA_DESCRIPTION_KEYWORD_RULES,
} from './wikipedia';
export type {
	XDomainApiAdapter,
	XDomainApiAdapterOptions,
	XEnrichmentAdapter,
	XEnrichmentAdapterInput,
	XEnrichmentPayload,
	XOpenGraphAdapter,
	XOpenGraphAdapterOptions,
	XPluginOptions,
	XPublicMetadataAdapter,
	XPublicMetadataAdapterOptions,
	XResolutionMode,
} from './x';
export { createXPlugin } from './x';
export { createXDomainApiAdapter } from './x/domain-api-adapter';
export { createXOpenGraphAdapter } from './x/opengraph-adapter';
export { createXPublicMetadataAdapter } from './x/public-metadata-adapter';
export type { YouTubePluginOptions } from './youtube';
export {
	canonicalYouTubeVideoId,
	createYouTubePlugin,
	parseYouTubeVideoId,
	YOUTUBE_VIDEO_ID_PATTERN,
} from './youtube';
export type { YouTubeOEmbedAdapter, YouTubeOEmbedAdapterOptions } from './youtube/oembed-adapter';
export { createYouTubeOEmbedAdapter } from './youtube/oembed-adapter';

export function createPlatformV0Profiles(): PlatformV0Profile[] {
	return [
		spotifyProfile,
		amazonProfile,
		githubProfile,
		goodreadsProfile,
		letterboxdProfile,
		placesProfile,
		npmProfile,
		xProfile,
		instagramProfile,
		tiktokProfile,
		youtubeProfile,
		wikipediaProfile,
		wikidataProfile,
		imdbProfile,
		tmdbProfile,
		openLibraryProfile,
		steamProfile,
		coingeckoProfile,
		coinmarketcapProfile,
		etsyProfile,
		shopifyProfile,
	];
}

export function createNonUrlV0Profiles(): NonUrlV0Profile[] {
	return [ethereumProfile, isbnProfile, intProfile, lexicalProfile, plainTextProfile];
}
