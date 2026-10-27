import { slugify, toStringMaybe, tryParseUrl, withPlatformMetadata } from '../shared/helpers';
import {
	createPlatformPlugin,
	type PlatformV0PluginOptions,
	type PlatformV0Profile,
} from '../shared/platform';
import { createInstagramOpenGraphAdapter } from './opengraph-adapter';

export type InstagramPluginOptions = PlatformV0PluginOptions & {
	// Instagram has no oEmbed/domain-api tier by default, so richer identity
	// data (name/bio/avatar) only ever arrives via OpenGraph. Opt-in per
	// caller (defaults to on, matching the ticket's expectation that Person
	// classification works for social profiles even without bespoke wiring)
	// so tests can still exercise the pure identity-only fallback.
	useDefaultOpenGraphAdapter?: boolean;
};

export const instagramProfile: PlatformV0Profile = {
	domain: 'instagram',
	display: {
		classificationSlugs: ['social-media-account', 'image', 'video-object'],
		exampleUrl: 'https://www.instagram.com/instagram/',
		host: 'instagram.com',
		label: 'Instagram',
	},
	supportsOEmbed: true,
	classifier: {
		id: 'instagram-url-classifier',
		priority: 10,
		classify(input: string) {
			const parsed = tryParseUrl(input, { allowBareHost: true });
			if (!parsed || !parsed.hostname.includes('instagram.com')) {
				return null;
			}

			const segments = parsed.pathname.split('/').filter(Boolean);
			if (segments.length < 1) {
				return null;
			}

			const firstSegment = segments[0];
			const secondSegment = segments[1];
			if (!firstSegment) {
				return null;
			}

			if (['p', 'reel', 'tv'].includes(firstSegment) && secondSegment) {
				const subtype = firstSegment === 'p' ? 'post' : 'video';
				return {
					type: 'url' as const,
					domain: 'instagram',
					subtype,
					confidence: 0.97,
					meta: {
						shortcode: secondSegment,
						canonicalUrl: `https://www.instagram.com/${firstSegment}/${secondSegment}`,
					},
				};
			}

			if (!['explore', 'stories'].includes(firstSegment)) {
				return {
					type: 'url' as const,
					domain: 'instagram',
					subtype: 'profile',
					confidence: 0.9,
					meta: {
						handle: firstSegment,
						canonicalUrl: `https://www.instagram.com/${firstSegment}`,
					},
				};
			}

			return null;
		},
	},
	resolveGeneric({ classification, canonicalUrl, now }) {
		if (classification.subtype === 'profile') {
			const handle = toStringMaybe(classification.meta.handle) ?? 'unknown';
			const name = `Instagram @${handle}`;
			return withPlatformMetadata(
				{
					schemaType: 'SocialMediaAccount',
					category: 'person',
					title: name,
					canonicalId: `instagram:user:${handle.toLowerCase()}`,
					sameAs: [canonicalUrl],
					data: {
						'@context': 'https://schema.org/',
						'@type': 'SocialMediaAccount',
						username: handle,
						platform: 'instagram',
						url: canonicalUrl,
						sameAs: [canonicalUrl],
					},
				},
				'instagram',
				classification.subtype,
				{
					pluginId: 'instagram',
					provider: 'instagram',
					fetchedAt: now,
					sourceUrl: canonicalUrl,
					confidence: classification.confidence,
				}
			);
		}

		if (classification.subtype === 'video') {
			const shortcode = toStringMaybe(classification.meta.shortcode) ?? '';
			const name = `Instagram Video ${shortcode}`.trim();
			return withPlatformMetadata(
				{
					schemaType: 'VideoObject',
					category: 'thing',
					title: name,
					canonicalId: `instagram:video:${shortcode || slugify(canonicalUrl)}`,
					sameAs: [canonicalUrl],
					data: {
						'@context': 'https://schema.org/',
						'@type': 'VideoObject',
						name,
						contentUrl: canonicalUrl,
						sameAs: [canonicalUrl],
					},
				},
				'instagram',
				classification.subtype,
				{
					pluginId: 'instagram',
					provider: 'instagram',
					fetchedAt: now,
					sourceUrl: canonicalUrl,
					confidence: classification.confidence,
				}
			);
		}

		const shortcode = toStringMaybe(classification.meta.shortcode) ?? '';
		const name = `Instagram Post ${shortcode}`.trim();
		return withPlatformMetadata(
			{
				schemaType: 'ImageObject',
				category: 'thing',
				title: name,
				canonicalId: `instagram:post:${shortcode || slugify(canonicalUrl)}`,
				sameAs: [canonicalUrl],
				data: {
					'@context': 'https://schema.org/',
					'@type': 'ImageObject',
					name,
					url: canonicalUrl,
					sameAs: [canonicalUrl],
				},
			},
			'instagram',
			classification.subtype,
			{
				pluginId: 'instagram',
				provider: 'instagram',
				fetchedAt: now,
				sourceUrl: canonicalUrl,
				confidence: classification.confidence,
			}
		);
	},
};

export function createInstagramPlugin(options: InstagramPluginOptions = {}) {
	const { useDefaultOpenGraphAdapter = true, ...platformOptions } = options;
	const openGraphAdapter =
		platformOptions.adapters?.openGraph ??
		(useDefaultOpenGraphAdapter ? createInstagramOpenGraphAdapter() : undefined);

	return createPlatformPlugin({
		pluginId: 'instagram',
		resolverId: 'instagram-resolver',
		profile: instagramProfile,
		options: {
			...platformOptions,
			adapters: {
				...platformOptions.adapters,
				openGraph: openGraphAdapter,
			},
		},
	});
}
