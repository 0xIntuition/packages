import { toStringMaybe, withPlatformMetadata } from '../shared/helpers';
import {
	createPlatformPlugin,
	type PlatformV0PluginOptions,
	type PlatformV0Profile,
} from '../shared/platform';
import { createLetterboxdDomainHtmlAdapter } from './domain-html-adapter';
import { createLetterboxdOpenGraphAdapter } from './opengraph-adapter';
import { parseLetterboxdUrl } from './url';

export type LetterboxdPluginOptions = PlatformV0PluginOptions & {
	useDefaultDomainHtmlAdapter?: boolean;
	useDefaultOpenGraphAdapter?: boolean;
};

export const letterboxdProfile: PlatformV0Profile = {
	domain: 'letterboxd',
	display: {
		classificationSlugs: ['movie'],
		exampleUrl: 'https://letterboxd.com/film/moonlight/',
		host: 'letterboxd.com',
		label: 'Letterboxd',
	},
	supportsOEmbed: false,
	classifier: {
		id: 'letterboxd-url-classifier',
		priority: 10,
		classify(input: string) {
			const target = parseLetterboxdUrl(input);
			if (!target) {
				return null;
			}

			return {
				type: 'url' as const,
				domain: 'letterboxd',
				subtype: 'film',
				confidence: 0.99,
				meta: {
					canonicalUrl: target.canonicalUrl,
					...(target.slug ? { slug: target.slug } : {}),
					...(target.tmdbId ? { tmdbId: target.tmdbId } : {}),
				},
			};
		},
	},
	resolveGeneric({ classification, canonicalUrl, now }) {
		const slug = toStringMaybe(classification.meta.slug);
		if (!slug) {
			return null;
		}
		return withPlatformMetadata(
			{
				schemaType: 'Movie',
				category: 'thing',
				title: canonicalUrl,
				canonicalId: `letterboxd:film:${slug}`,
				sameAs: [canonicalUrl],
				data: {
					'@context': 'https://schema.org/',
					'@type': 'Movie',
					name: canonicalUrl,
					url: canonicalUrl,
					sameAs: [canonicalUrl],
				},
			},
			'letterboxd',
			'film',
			{
				pluginId: 'letterboxd',
				provider: 'letterboxd',
				fetchedAt: now,
				sourceUrl: canonicalUrl,
				confidence: classification.confidence,
			}
		);
	},
};

export function createLetterboxdPlugin(options: LetterboxdPluginOptions = {}) {
	const {
		useDefaultDomainHtmlAdapter = true,
		useDefaultOpenGraphAdapter = true,
		...platformOptions
	} = options;
	const domainHtmlAdapter =
		platformOptions.adapters?.domainHtml ??
		(useDefaultDomainHtmlAdapter ? createLetterboxdDomainHtmlAdapter() : undefined);
	const openGraphAdapter =
		platformOptions.adapters?.openGraph ??
		(useDefaultOpenGraphAdapter ? createLetterboxdOpenGraphAdapter() : undefined);

	return createPlatformPlugin({
		pluginId: 'letterboxd',
		resolverId: 'letterboxd-resolver',
		profile: letterboxdProfile,
		options: {
			...platformOptions,
			adapters: {
				...platformOptions.adapters,
				domainHtml: domainHtmlAdapter,
				openGraph: openGraphAdapter,
			},
		},
	});
}

export { createLetterboxdDomainHtmlAdapter } from './domain-html-adapter';
export { createLetterboxdOpenGraphAdapter } from './opengraph-adapter';
export { buildLetterboxdSameAs, isLetterboxdHost, parseLetterboxdUrl } from './url';
