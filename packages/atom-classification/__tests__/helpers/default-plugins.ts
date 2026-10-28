import type { AtomClassificationPlugin } from '../../src/plugins';
import {
	type DefaultClassificationPresetOptions,
	defaultClassificationPreset,
} from '../../src/presets';

const NO_NETWORK_FETCH = async () => ({ ok: false, status: 404, text: async () => '' });

export function createDefaultTestPlugins(
	options: DefaultClassificationPresetOptions = {}
): AtomClassificationPlugin[] {
	return defaultClassificationPreset({
		...options,
		defaultUrlPluginOptions: {
			// default-url now optionally fetches OpenGraph metadata (ENG-13195);
			// keep it off in the shared test preset so no suite accidentally
			// makes a live network call.
			fetch: NO_NETWORK_FETCH,
			...(options.defaultUrlPluginOptions ?? {}),
		},
		githubPluginOptions: {
			useDefaultDomainApiAdapter: false,
			...(options.githubPluginOptions ?? {}),
		},
		goodreadsPluginOptions: {
			useDefaultOpenLibraryAdapter: false,
			...(options.goodreadsPluginOptions ?? {}),
		},
		isbnPluginOptions: {
			openLibrary: false,
			...(options.isbnPluginOptions ?? {}),
		},
		imdbPluginOptions: {
			useDefaultDomainHtmlAdapter: false,
			...(options.imdbPluginOptions ?? {}),
		},
		tmdbPluginOptions: options.tmdbPluginOptions,
		xPluginOptions: {
			useDefaultDomainApiAdapter: false,
			useDefaultPublicMetadataAdapter: false,
			useDefaultOpenGraphAdapter: false,
			...(options.xPluginOptions ?? {}),
		},
		instagramPluginOptions: {
			// Instagram's default OpenGraph adapter falls back to global fetch
			// when no fetcher is injected — keep it off in the shared test
			// preset so no suite accidentally makes a live network call.
			useDefaultOpenGraphAdapter: false,
			...(options.instagramPluginOptions ?? {}),
		},
		placesPluginOptions: {
			// Same rationale as instagram above: no fetcher injected here.
			useDefaultOpenGraphAdapter: false,
			...(options.placesPluginOptions ?? {}),
		},
		youtubePluginOptions: {
			useDefaultOEmbedAdapter: false,
			...(options.youtubePluginOptions ?? {}),
		},
		wikipediaPluginOptions: {
			useDefaultDomainApiAdapter: false,
			...(options.wikipediaPluginOptions ?? {}),
		},
		wikidataPluginOptions: {
			useDefaultDomainApiAdapter: false,
			...(options.wikidataPluginOptions ?? {}),
		},
	});
}
