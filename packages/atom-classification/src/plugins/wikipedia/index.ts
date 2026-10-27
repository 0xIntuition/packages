import { toStringMaybe, tryParseUrl } from '../shared/helpers';
import {
	createPlatformPlugin,
	type PlatformV0PluginOptions,
	type PlatformV0Profile,
} from '../shared/platform';
import {
	createWikipediaDomainApiAdapter,
	type WikipediaDomainApiAdapterOptions,
} from './domain-api-adapter';
import { buildWikipediaAtomFromEvidence, inferWikipediaTypeFromEvidence } from './typing';

export type WikipediaPluginOptions = PlatformV0PluginOptions &
	WikipediaDomainApiAdapterOptions & {
		useDefaultDomainApiAdapter?: boolean;
	};

export const wikipediaProfile: PlatformV0Profile = {
	domain: 'wikipedia',
	display: {
		classificationSlugs: ['*'],
		exampleUrl: 'https://en.wikipedia.org/wiki/Ethereum',
		host: 'wikipedia.org',
		label: 'Wikipedia',
	},
	supportsOEmbed: true,
	classifier: {
		id: 'wikipedia-url-classifier',
		priority: 10,
		classify(input: string) {
			const parsed = tryParseUrl(input);
			if (!parsed || !parsed.hostname.includes('wikipedia.org')) {
				return null;
			}

			const segments = parsed.pathname.split('/').filter(Boolean);
			const firstSegment = segments[0];
			if (segments.length < 2 || firstSegment !== 'wiki') {
				return null;
			}

			const articleTitle = decodeURIComponent(segments.slice(1).join('/'));
			const normalizedTitle = articleTitle.replace(/_/g, ' ');
			const inferred = inferWikipediaTypeFromEvidence({ title: normalizedTitle });

			return {
				type: 'url' as const,
				domain: 'wikipedia',
				subtype: 'article',
				confidence: 0.95,
				meta: {
					articleTitle: normalizedTitle,
					canonicalUrl: `https://${parsed.hostname}/wiki/${encodeURIComponent(articleTitle)}`,
					inferredSchemaType: inferred.schemaType,
					inferredCategory: inferred.category,
				},
			};
		},
	},
	resolveGeneric({ classification, canonicalUrl, now }) {
		const articleTitle = toStringMaybe(classification.meta.articleTitle) ?? 'Wikipedia Article';
		const atom = buildWikipediaAtomFromEvidence({
			canonicalUrl,
			classificationConfidence: classification.confidence,
			title: articleTitle,
		});

		return {
			...atom,
			metadata: {
				...(atom.metadata ?? {}),
				fetchedAt: now,
			},
		};
	},
};

export function createWikipediaPlugin(options: WikipediaPluginOptions = {}) {
	const {
		fetch,
		language,
		userAgent,
		useDefaultDomainApiAdapter = true,
		...platformOptions
	} = options;
	const domainApiAdapter =
		platformOptions.adapters?.domainApi ??
		(useDefaultDomainApiAdapter
			? createWikipediaDomainApiAdapter({ fetch, language, userAgent })
			: undefined);
	const profile = domainApiAdapter
		? { ...wikipediaProfile, allowDomainApiWithoutCredentials: true }
		: wikipediaProfile;

	return createPlatformPlugin({
		pluginId: 'wikipedia',
		resolverId: 'wikipedia-resolver',
		profile,
		options: {
			...platformOptions,
			adapters: {
				...platformOptions.adapters,
				domainApi: domainApiAdapter,
			},
		},
	});
}

export type {
	WikipediaDomainApiAdapter,
	WikipediaDomainApiAdapterOptions,
} from './domain-api-adapter';
export { createWikipediaDomainApiAdapter } from './domain-api-adapter';
export type {
	WikipediaSchemaType,
	WikipediaTypeInference,
	WikipediaTypingEvidence,
} from './typing';
export { inferWikipediaTypeFromEvidence, WIKIPEDIA_DESCRIPTION_KEYWORD_RULES } from './typing';
