import type { AtomClassificationPlugin } from '../plugins';
import {
	createAmazonPlugin,
	createCoinGeckoPlugin,
	createCoinMarketCapPlugin,
	createDefaultUrlPlugin,
	createEtherscanPlugin,
	createEtsyPlugin,
	createGitHubPlugin,
	createGoodreadsPlugin,
	createImdbPlugin,
	createInstagramPlugin,
	createIntuitionIdPlugin,
	createIsbnPlugin,
	createLetterboxdPlugin,
	createNpmPlugin,
	createOpenLibraryPlugin,
	createPlacesPlugin,
	createPlainTextPlugin,
	createShopifyPlugin,
	createSpotifyPlugin,
	createSteamPlugin,
	createTikTokPlugin,
	createTmdbPlugin,
	createTypeProfilesPlugin,
	createWikidataPlugin,
	createWikipediaPlugin,
	createXPlugin,
	createYouTubePlugin,
	type DefaultUrlPluginOptions,
	type EtherscanPluginOptions,
	type GitHubPluginOptions,
	type GoodreadsPluginOptions,
	type ImdbPluginOptions,
	type InstagramPluginOptions,
	type IsbnPluginOptions,
	type LetterboxdPluginOptions,
	type NpmPluginOptions,
	type OpenLibraryPluginOptions,
	type PlacesPluginOptions,
	type SpotifyPluginOptions,
	type SteamPluginOptions,
	type TmdbPluginOptions,
	type WikidataPluginOptions,
	type WikipediaPluginOptions,
	type XPluginOptions,
} from '../plugins/index';
import type { PlatformV0PluginOptions } from '../plugins/shared/platform';
import type { YouTubePluginOptions } from '../plugins/youtube';

type PlatformStageAdapters = NonNullable<PlatformV0PluginOptions['adapters']>;
type SharedPlatformAdapters = Pick<PlatformStageAdapters, 'oEmbed' | 'openGraph'>;

export type DefaultClassificationPresetPlatformOptions = Omit<
	PlatformV0PluginOptions,
	'adapters'
> & {
	adapters?: Partial<SharedPlatformAdapters>;
};

export type DefaultClassificationPresetOptions = {
	amazonPluginOptions?: PlatformV0PluginOptions;
	defaultUrlPluginOptions?: DefaultUrlPluginOptions;
	etherscanPluginOptions?: EtherscanPluginOptions;
	githubPluginOptions?: GitHubPluginOptions;
	goodreadsPluginOptions?: GoodreadsPluginOptions;
	imdbPluginOptions?: ImdbPluginOptions;
	instagramPluginOptions?: InstagramPluginOptions;
	isbnPluginOptions?: IsbnPluginOptions;
	letterboxdPluginOptions?: LetterboxdPluginOptions;
	npmPluginOptions?: NpmPluginOptions;
	openLibraryPluginOptions?: OpenLibraryPluginOptions;
	placesPluginOptions?: PlacesPluginOptions;
	platformV0PluginOptions?: DefaultClassificationPresetPlatformOptions;
	spotifyPluginOptions?: SpotifyPluginOptions;
	steamPluginOptions?: SteamPluginOptions;
	tiktokPluginOptions?: PlatformV0PluginOptions;
	tmdbPluginOptions?: TmdbPluginOptions;
	wikipediaPluginOptions?: WikipediaPluginOptions;
	wikidataPluginOptions?: WikidataPluginOptions;
	xPluginOptions?: XPluginOptions;
	youtubePluginOptions?: YouTubePluginOptions;
	includeDefaultUrlPlugin?: boolean;
};

export function defaultClassificationPreset(
	options: DefaultClassificationPresetOptions = {}
): AtomClassificationPlugin[] {
	const sharedPlatformOptions = normalizeSharedPlatformOptions(options.platformV0PluginOptions);
	const youtubePluginOptions = mergeYouTubePluginOptions(
		sharedPlatformOptions,
		options.youtubePluginOptions
	);
	const githubPluginOptions = mergeGitHubPluginOptions(
		sharedPlatformOptions,
		options.githubPluginOptions
	);
	const goodreadsPluginOptions = mergePlatformPluginOptions(
		sharedPlatformOptions,
		options.goodreadsPluginOptions
	);
	const letterboxdPluginOptions = mergePlatformPluginOptions(
		sharedPlatformOptions,
		options.letterboxdPluginOptions
	);
	const placesPluginOptions = mergePlatformPluginOptions(
		sharedPlatformOptions,
		options.placesPluginOptions
	);
	const spotifyPluginOptions = mergeSpotifyPluginOptions(
		sharedPlatformOptions,
		options.spotifyPluginOptions
	);
	const npmPluginOptions = mergePlatformPluginOptions(
		sharedPlatformOptions,
		options.npmPluginOptions
	);
	const amazonPluginOptions = mergePlatformPluginOptions(
		sharedPlatformOptions,
		options.amazonPluginOptions
	);
	const xPluginOptions = mergeXPluginOptions(sharedPlatformOptions, options.xPluginOptions);
	const instagramPluginOptions = mergePlatformPluginOptions(
		sharedPlatformOptions,
		options.instagramPluginOptions
	);
	const tiktokPluginOptions = mergePlatformPluginOptions(
		sharedPlatformOptions,
		options.tiktokPluginOptions
	);
	const wikipediaPluginOptions = mergePlatformPluginOptions(
		sharedPlatformOptions,
		options.wikipediaPluginOptions
	);
	const wikidataPluginOptions = mergePlatformPluginOptions(
		sharedPlatformOptions,
		options.wikidataPluginOptions
	);
	// IMDb accepts only its guarded catalog transport, never shared page adapters.
	const imdbPluginOptions = options.imdbPluginOptions;
	const tmdbPluginOptions = mergeTmdbPluginOptions(
		sharedPlatformOptions,
		options.tmdbPluginOptions
	);
	const openLibraryPluginOptions = mergePlatformPluginOptions(
		sharedPlatformOptions,
		options.openLibraryPluginOptions
	);
	const steamPluginOptions = mergePlatformPluginOptions(
		sharedPlatformOptions,
		options.steamPluginOptions
	);
	const plugins: AtomClassificationPlugin[] = [
		createTypeProfilesPlugin(),
		createEtherscanPlugin(options.etherscanPluginOptions),
		createIsbnPlugin(options.isbnPluginOptions),
		createIntuitionIdPlugin(),
		// Keep lexical available as an explicit plugin, but do not include it in the
		// default preset. Generic non-URL text should resolve through plain-text
		// fallback unless a caller opts into lexical classification deliberately.
		createPlainTextPlugin(),
		createSpotifyPlugin(spotifyPluginOptions),
		createAmazonPlugin(amazonPluginOptions),
		createGitHubPlugin(githubPluginOptions),
		createGoodreadsPlugin(goodreadsPluginOptions),
		createLetterboxdPlugin(letterboxdPluginOptions),
		createPlacesPlugin(placesPluginOptions),
		createNpmPlugin(npmPluginOptions),
		createXPlugin(xPluginOptions),
		createInstagramPlugin(instagramPluginOptions),
		createTikTokPlugin(tiktokPluginOptions),
		createYouTubePlugin(youtubePluginOptions),
		createWikipediaPlugin(wikipediaPluginOptions),
		createWikidataPlugin(wikidataPluginOptions),
		createImdbPlugin(imdbPluginOptions),
		createTmdbPlugin(tmdbPluginOptions),
		createOpenLibraryPlugin(openLibraryPluginOptions),
		createSteamPlugin(steamPluginOptions),
		createCoinGeckoPlugin(),
		createCoinMarketCapPlugin(),
		createEtsyPlugin(),
		createShopifyPlugin(),
	];

	if (options.includeDefaultUrlPlugin !== false) {
		plugins.push(createDefaultUrlPlugin(options.defaultUrlPluginOptions));
	}

	return plugins;
}

// Only cross-domain fallback stages should be inherited from the preset layer.
// Domain-aware stages like `domainApi` or `domainHtml` must stay plugin-scoped so
// one plugin cannot accidentally override another plugin's resolver behavior.
function normalizeSharedPlatformOptions(
	options: DefaultClassificationPresetPlatformOptions | undefined
): PlatformV0PluginOptions | undefined {
	if (!options) {
		return undefined;
	}

	const adapters: PlatformV0PluginOptions['adapters'] = {};
	if (options.adapters?.oEmbed) {
		adapters.oEmbed = options.adapters.oEmbed;
	}
	if (options.adapters?.openGraph) {
		adapters.openGraph = options.adapters.openGraph;
	}

	return {
		...options,
		adapters: Object.keys(adapters).length > 0 ? adapters : undefined,
	};
}

function mergeXPluginOptions(
	platformOptions: PlatformV0PluginOptions | undefined,
	xOptions: XPluginOptions | undefined
): XPluginOptions {
	return mergePlatformPluginOptions(platformOptions, xOptions);
}

function mergeSpotifyPluginOptions(
	platformOptions: PlatformV0PluginOptions | undefined,
	spotifyOptions: SpotifyPluginOptions | undefined
): SpotifyPluginOptions {
	return mergePlatformPluginOptions(platformOptions, spotifyOptions);
}

function mergeGitHubPluginOptions(
	platformOptions: PlatformV0PluginOptions | undefined,
	githubOptions: GitHubPluginOptions | undefined
): GitHubPluginOptions {
	return mergePlatformPluginOptions(platformOptions, githubOptions);
}

function mergeYouTubePluginOptions(
	platformOptions: PlatformV0PluginOptions | undefined,
	youtubeOptions: YouTubePluginOptions | undefined
): YouTubePluginOptions {
	return mergePlatformPluginOptions(platformOptions, youtubeOptions);
}

function mergeTmdbPluginOptions(
	platformOptions: PlatformV0PluginOptions | undefined,
	tmdbOptions: TmdbPluginOptions | undefined
): TmdbPluginOptions {
	const merged = mergePlatformPluginOptions(platformOptions, tmdbOptions);
	const { openGraph: _forbiddenTmdbAdapter, ...adapters } = merged.adapters ?? {};
	return {
		...merged,
		adapters: Object.keys(adapters).length > 0 ? adapters : undefined,
	};
}

function mergePlatformPluginOptions<T extends PlatformV0PluginOptions>(
	platformOptions: PlatformV0PluginOptions | undefined,
	pluginOptions: T | undefined
): T {
	// Shared preset options provide the baseline cross-domain stages, while the
	// plugin-specific options own any domain-aware adapter overrides.
	return {
		...(platformOptions ?? {}),
		...(pluginOptions ?? {}),
		adapters: {
			...(platformOptions?.adapters ?? {}),
			...(pluginOptions?.adapters ?? {}),
		},
	} as T;
}
