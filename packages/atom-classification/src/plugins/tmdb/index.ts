import { toStringMaybe, tryParseUrl, withPlatformMetadata } from '../shared/helpers';
import {
	createPlatformPlugin,
	type PlatformV0PluginOptions,
	type PlatformV0Profile,
} from '../shared/platform';

type TmdbMediaType = 'movie' | 'tv';

type TmdbTarget = {
	mediaType: TmdbMediaType;
	tmdbId: string;
	canonicalUrl: string;
};

export const TMDB_UNAVAILABLE_COPY =
	"We can't source this title from TMDB; try the Letterboxd or Wikipedia link";

type TmdbPlatformAdapters = Omit<NonNullable<PlatformV0PluginOptions['adapters']>, 'openGraph'>;

export type TmdbPluginOptions = Omit<PlatformV0PluginOptions, 'adapters'> & {
	adapters?: TmdbPlatformAdapters & { openGraph?: never };
};

export const tmdbProfile: PlatformV0Profile = {
	domain: 'tmdb',
	display: {
		classificationSlugs: ['movie', 'tv-series'],
		exampleUrl: 'https://www.themoviedb.org/movie/27205',
		host: 'themoviedb.org',
		label: 'TMDB',
	},
	supportsOEmbed: false,
	classifier: {
		id: 'tmdb-url-classifier',
		priority: 10,
		classify(input: string) {
			const target = parseTmdbUrl(input);
			if (!target) {
				return null;
			}

			return {
				type: 'url' as const,
				domain: 'tmdb',
				subtype: target.mediaType,
				confidence: 0.99,
				meta: {
					mediaType: target.mediaType,
					tmdbId: target.tmdbId,
					canonicalUrl: target.canonicalUrl,
				},
			};
		},
	},
	resolveGeneric({ classification, canonicalUrl, now }) {
		const mediaType = toTmdbMediaType(toStringMaybe(classification.meta.mediaType)) ?? 'movie';
		const schemaType = mediaType === 'tv' ? 'TVSeries' : 'Movie';
		const tmdbId = toStringMaybe(classification.meta.tmdbId);
		if (!tmdbId) {
			return null;
		}

		return withPlatformMetadata(
			{
				schemaType,
				category: 'thing',
				// Ruling R1b: this is operational copy, never TMDB-derived title data.
				title: TMDB_UNAVAILABLE_COPY,
				canonicalId: `tmdb:${mediaType}:${tmdbId}`,
				sameAs: [canonicalUrl],
				metadata: { identityBridgeEligible: true, resolutionMode: 'identity-only' },
				data: {
					'@context': 'https://schema.org/',
					'@type': schemaType,
					identifier: `tmdb:${mediaType}:${tmdbId}`,
					sameAs: [canonicalUrl],
				},
			},
			'tmdb',
			classification.subtype,
			{
				pluginId: 'tmdb',
				provider: 'tmdb',
				fetchedAt: now,
				sourceUrl: canonicalUrl,
				confidence: classification.confidence,
				resolutionMode: 'identity-only',
			}
		);
	},
};

export function createTmdbPlugin(options: TmdbPluginOptions = {}) {
	const rawAdapters = (options as PlatformV0PluginOptions).adapters;
	const { openGraph: _forbiddenOpenGraphAdapter, ...adapters } = rawAdapters ?? {};
	return createPlatformPlugin({
		pluginId: 'tmdb',
		resolverId: 'tmdb-resolver',
		profile: tmdbProfile,
		// JP ruling R1b: "TMDB is never a source in any form — bulk or in-app."
		// Strip the slot at runtime too, so untyped/legacy callers cannot restore it.
		options: {
			...options,
			adapters: Object.keys(adapters).length > 0 ? adapters : undefined,
		},
	});
}

function parseTmdbUrl(input: string): TmdbTarget | undefined {
	const parsed = tryParseUrl(input);
	if (!parsed) {
		return undefined;
	}

	const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
	if (host !== 'themoviedb.org') {
		return undefined;
	}

	const segments = parsed.pathname.split('/').filter(Boolean);
	if (segments.length !== 2) {
		return undefined;
	}
	const mediaType = toTmdbMediaType(segments[0]);
	const tmdbId = parseTmdbId(segments[1]);
	if (!mediaType || !tmdbId) {
		return undefined;
	}

	return {
		mediaType,
		tmdbId,
		canonicalUrl: `https://www.themoviedb.org/${mediaType}/${tmdbId}`,
	};
}

function toTmdbMediaType(value: string | undefined): TmdbMediaType | undefined {
	if (value === 'movie' || value === 'tv') {
		return value;
	}

	return undefined;
}

function parseTmdbId(value: string | undefined): string | undefined {
	const match = value?.match(/^([1-9]\d*)(?:[-_][^/]+)?$/);
	return match?.[1];
}
