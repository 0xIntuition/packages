import { slugify, toStringMaybe, withPlatformMetadata } from '../shared/helpers';
import {
	createPlatformPlugin,
	type PlatformV0PluginOptions,
	type PlatformV0Profile,
} from '../shared/platform';
import { createYouTubeOEmbedAdapter } from './oembed-adapter';
import { canonicalYouTubeVideoId } from './video-id';

export type YouTubePluginOptions = PlatformV0PluginOptions & {
	useDefaultOEmbedAdapter?: boolean;
};

export const youtubeProfile: PlatformV0Profile = {
	domain: 'youtube',
	display: {
		classificationSlugs: ['video-object'],
		exampleUrl: 'https://www.youtube.com/watch?v=bewVnEugEqE',
		host: 'youtube.com',
		label: 'YouTube',
	},
	supportsOEmbed: true,
	classifier: {
		id: 'youtube-url-classifier',
		priority: 10,
		classify(input: string) {
			const videoId = canonicalYouTubeVideoId(input);
			if (!videoId) {
				return null;
			}

			const canonicalUrl = `https://www.youtube.com/watch?v=${videoId}`;
			return {
				type: 'url' as const,
				domain: 'youtube',
				subtype: 'video',
				confidence: 0.99,
				meta: {
					videoId,
					canonicalUrl,
				},
			};
		},
	},
	resolveGeneric({ classification, canonicalUrl, now }) {
		const videoId = toStringMaybe(classification.meta.videoId) ?? '';
		const name = `YouTube Video ${videoId}`.trim();
		return withPlatformMetadata(
			{
				schemaType: 'VideoObject',
				category: 'thing',
				title: name,
				canonicalId: `youtube:video:${videoId || slugify(canonicalUrl)}`,
				sameAs: [canonicalUrl],
				data: {
					'@context': 'https://schema.org/',
					'@type': 'VideoObject',
					name,
					contentUrl: canonicalUrl,
					sameAs: [canonicalUrl],
				},
			},
			'youtube',
			classification.subtype,
			{
				pluginId: 'youtube',
				provider: 'youtube',
				fetchedAt: now,
				sourceUrl: canonicalUrl,
				confidence: classification.confidence,
			}
		);
	},
};

export function createYouTubePlugin(options: YouTubePluginOptions = {}) {
	const { useDefaultOEmbedAdapter = true, ...platformOptions } = options;
	const oEmbedAdapter =
		platformOptions.adapters?.oEmbed ??
		(useDefaultOEmbedAdapter ? createYouTubeOEmbedAdapter() : undefined);

	return createPlatformPlugin({
		pluginId: 'youtube',
		resolverId: 'youtube-resolver',
		profile: youtubeProfile,
		options: {
			...platformOptions,
			adapters: {
				...platformOptions.adapters,
				oEmbed: oEmbedAdapter,
			},
		},
	});
}

export type { YouTubeOEmbedAdapter, YouTubeOEmbedAdapterOptions } from './oembed-adapter';
export { createYouTubeOEmbedAdapter } from './oembed-adapter';
export {
	canonicalYouTubeVideoId,
	parseYouTubeVideoId,
	YOUTUBE_VIDEO_ID_PATTERN,
} from './video-id';
