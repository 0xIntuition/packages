import {
	type AtomClassificationPlugin,
	createAmazonCanopyPluginOptions,
	createSpotifyDomainApiAdapter,
	createYouTubeOEmbedAdapter,
	defaultClassificationPreset,
} from '@0xintuition/atom-classification';
import {
	academicPreset,
	companyPreset,
	createServerDefaultPresetOptions,
	cryptoPreset,
	type EnrichmentPlugin,
	musicPreset,
	serverDefaultPreset,
} from '@0xintuition/atom-enrichment';

import type { EnrichmentPresetName } from './config';

export type EnrichmentPresetFactoryRegistry = Record<
	EnrichmentPresetName,
	() => EnrichmentPlugin[]
>;

export function createEnrichmentPresetFactories(
	env: Record<string, string | undefined>
): EnrichmentPresetFactoryRegistry {
	const serverOptions = createServerDefaultPresetOptions(env);
	const allProviders = () => serverDefaultPreset(serverOptions);

	return {
		default: allProviders,
		company: () =>
			companyPreset({
				brand: { apiKey: env.BRANDFETCH_API_KEY },
			}),
		music: () =>
			musicPreset({ spotify: serverOptions.spotify, musicbrainz: serverOptions.musicbrainz }),
		crypto: () =>
			cryptoPreset({
				etherscan: { apiKey: env.ETHERSCAN_API_KEY },
				coingecko: { apiKey: env.COINGECKO_API_KEY },
			}),
		academic: () => academicPreset(),
		custom: allProviders,
	};
}

export function createClassificationPlugins(
	env: Record<string, string | undefined>
): AtomClassificationPlugin[] {
	const canopyApiKey = env.CANOPY_API_KEY;
	const spotifyClientId = env.SPOTIFY_CLIENT_ID;
	const spotifyClientSecret = env.SPOTIFY_CLIENT_SECRET;

	return defaultClassificationPreset({
		imdbPluginOptions: { apiKey: env.TMDB_API_KEY ?? '' },
		amazonPluginOptions: createAmazonCanopyPluginOptions({ apiKey: canopyApiKey }),
		spotifyPluginOptions: {
			credentials: {
				spotify: {
					clientId: spotifyClientId,
					clientSecret: spotifyClientSecret,
				},
			},
			adapters: {
				domainApi: createSpotifyDomainApiAdapter({
					clientId: spotifyClientId,
					clientSecret: spotifyClientSecret,
					market: env.SPOTIFY_MARKET,
				}),
			},
		},
		etherscanPluginOptions: { apiKey: env.ETHERSCAN_API_KEY },
		platformV0PluginOptions: {
			credentials: {
				spotify: {
					clientId: spotifyClientId,
					clientSecret: spotifyClientSecret,
				},
				x: { token: env.X_BEARER_TOKEN },
			},
			adapters: { oEmbed: createYouTubeOEmbedAdapter() },
		},
	});
}

/** Worker scope policies are data; scheduling and persistence stay with consumers. */
export const defaultScopes = {
	full: { domains: undefined, providers: undefined, artifactTypes: undefined },
	music: {
		domains: ['music'],
		providers: ['spotify', 'musicbrainz', 'apple-music', 'wikidata'],
		artifactTypes: ['opengraph', 'spotify', 'musicbrainz', 'apple-music', 'wikipedia', 'wikidata'],
	},
	podcasts: {
		domains: ['podcast'],
		providers: ['spotify', 'apple-music', 'podcast-index', 'wikidata'],
		artifactTypes: [
			'opengraph',
			'spotify',
			'apple-music',
			'podcast-index',
			'wikipedia',
			'wikidata',
		],
	},
	'music-and-podcasts': {
		domains: ['music', 'podcast'],
		providers: ['spotify', 'musicbrainz', 'apple-music', 'podcast-index', 'wikidata'],
		artifactTypes: [
			'opengraph',
			'spotify',
			'musicbrainz',
			'apple-music',
			'podcast-index',
			'wikipedia',
			'wikidata',
		],
	},
} as const satisfies Record<
	string,
	{
		domains: readonly string[] | undefined;
		providers: readonly import('@0xintuition/iid-registry').ProviderSlug[] | undefined;
		artifactTypes: readonly string[] | undefined;
	}
>;
