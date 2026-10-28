import type { ResolverAtom, ResolverContext } from '../../plugins';
import {
	slugify,
	toRecordMaybe,
	toStringMaybe,
	tryParseUrl,
	withPlatformMetadata,
} from '../shared/helpers';
import { createPlatformPlugin, type PlatformV0Profile } from '../shared/platform';
import {
	createImdbDomainHtmlAdapter,
	type ImdbDomainHtmlAdapterOptions,
} from './domain-html-adapter';
import { isImdbHostname } from './url';

export type ImdbPluginOptions = ImdbDomainHtmlAdapterOptions & {
	useDefaultDomainHtmlAdapter?: boolean;
};

export const imdbProfile: PlatformV0Profile = {
	domain: 'imdb',
	display: {
		classificationSlugs: ['movie', 'tv-series', 'social-media-account'],
		exampleUrl: 'https://www.imdb.com/title/tt1375666/',
		host: 'imdb.com',
		label: 'IMDb',
	},
	supportsOEmbed: false,
	classifier: {
		id: 'imdb-url-classifier',
		priority: 10,
		classify(input: string) {
			const parsed = tryParseUrl(input);
			if (!parsed || !isImdbHostname(parsed.hostname)) {
				return null;
			}

			const segments = parsed.pathname.split('/').filter(Boolean);
			if (segments.length < 2) {
				return null;
			}

			const firstSegment = segments[0];
			const secondSegment = segments[1];
			if (!firstSegment || !secondSegment) {
				return null;
			}

			if (firstSegment === 'title' && /^tt\d+$/.test(secondSegment)) {
				return {
					type: 'url' as const,
					domain: 'imdb',
					subtype: 'title',
					confidence: 0.98,
					meta: {
						titleId: secondSegment,
						canonicalUrl: `https://www.imdb.com/title/${secondSegment}/`,
					},
				};
			}

			if (firstSegment === 'name' && /^nm\d+$/.test(secondSegment)) {
				return {
					type: 'url' as const,
					domain: 'imdb',
					subtype: 'person',
					confidence: 0.97,
					meta: {
						personId: secondSegment,
						canonicalUrl: `https://www.imdb.com/name/${secondSegment}/`,
					},
				};
			}

			return null;
		},
	},
	resolveGeneric({ classification, canonicalUrl, now }) {
		if (classification.subtype === 'person') {
			const personId = toStringMaybe(classification.meta.personId) ?? slugify(canonicalUrl);
			const name = `IMDb Person ${personId}`;
			return withPlatformMetadata(
				{
					schemaType: 'SocialMediaAccount',
					category: 'person',
					title: name,
					canonicalId: `imdb:name:${personId}`,
					sameAs: [canonicalUrl],
					data: {
						'@context': 'https://schema.org/',
						'@type': 'SocialMediaAccount',
						username: personId,
						platform: 'imdb',
						url: canonicalUrl,
						sameAs: [canonicalUrl],
					},
				},
				'imdb',
				classification.subtype,
				{
					pluginId: 'imdb',
					provider: 'imdb',
					fetchedAt: now,
					sourceUrl: canonicalUrl,
					confidence: classification.confidence,
				}
			);
		}

		return null;
	},
};

export function createImdbPlugin(options: ImdbPluginOptions = {}) {
	// Reject legacy callers at runtime as well as removing adapters from the public type.
	const hasLegacyAdapters = 'adapters' in options && options.adapters != null;
	const domainHtmlAdapter =
		!hasLegacyAdapters && options.useDefaultDomainHtmlAdapter !== false
			? createImdbDomainHtmlAdapter({
					apiKey: options.apiKey ?? imdbApiKeyFromEnv(),
					fetch: options.fetch,
					resolveHostname: options.resolveHostname,
					findTimeoutMs: options.findTimeoutMs,
				})
			: undefined;

	const plugin = createPlatformPlugin({
		pluginId: 'imdb',
		resolverId: 'imdb-resolver',
		profile: imdbProfile,
		options: {
			adapters: {
				domainHtml: domainHtmlAdapter,
			},
		},
	});
	return {
		...plugin,
		resolvers: plugin.resolvers?.map((resolver) => ({
			...resolver,
			resolve: async (context: ResolverContext) => {
				const result = hasLegacyAdapters ? null : await resolver.resolve(context);
				if (result?.atoms?.length && result.atoms.every(hasAcquiredImdbTitle)) return result;
				const imdbBridge = toRecordMaybe(result?.atoms?.[0]?.metadata?.imdbBridge) ??
					toRecordMaybe(context.classification.meta.imdbBridge) ?? {
						status: 'unavailable',
						hits: 0,
					};
				return {
					...result,
					atoms: [],
					terminal: true,
					fallbackUsed: true,
					metadata: { ...result?.metadata, imdbBridge },
					classificationMetaPatch: {
						...result?.classificationMetaPatch,
						imdbBridge,
						acquisitionOutcome: { status: 'unavailable', terminal: true, reason: 'adapter_null' },
					},
				};
			},
		})),
	};
}

function imdbApiKeyFromEnv(): string | undefined {
	return typeof process === 'undefined' ? undefined : process.env.TMDB_API_KEY;
}

function hasAcquiredImdbTitle(atom: ResolverAtom): boolean {
	const bridge = toRecordMaybe(atom.metadata?.imdbBridge);
	const title = atom.title?.trim();
	const name = toStringMaybe(atom.data?.name)?.trim();
	const placeholder = /^(?:IMDb\s+(?:Title|Person)\b|(?:tt|nm)\d+$)/i;
	return (
		(bridge?.status === 'hit' || bridge?.status === 'miss') &&
		!!title &&
		!placeholder.test(title) &&
		(!name || !placeholder.test(name))
	);
}
