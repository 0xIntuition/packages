import type { ResolverAtom } from '../../plugins';
import { slugify, toStringMaybe, withPlatformMetadata } from '../shared/helpers';
import {
	createOpenGraphPlatformAdapter,
	type OpenGraphMetadata,
	type OpenGraphPlatformAdapter,
} from '../shared/opengraph';

export type InstagramOpenGraphAdapterOptions = {
	fetch?: Parameters<typeof createOpenGraphPlatformAdapter>[0]['fetch'];
	headers?: Record<string, string>;
	resolveHostname?: Parameters<typeof createOpenGraphPlatformAdapter>[0]['resolveHostname'];
};

export type InstagramOpenGraphAdapter = OpenGraphPlatformAdapter;

// Instagram has no public oEmbed/domain-api tier wired in by default, so its
// profile resolution otherwise never gets richer than the bare handle. This
// adapter opportunistically upgrades identity data (name/bio/avatar) from the
// page's own OpenGraph tags when a fetcher is available, while staying
// identity-only (category stays 'person'; no scraped counts are fabricated).
export function createInstagramOpenGraphAdapter(
	options: InstagramOpenGraphAdapterOptions = {}
): InstagramOpenGraphAdapter {
	return createOpenGraphPlatformAdapter({
		fetch: options.fetch,
		headers: options.headers,
		resolveHostname: options.resolveHostname,
		domains: ['instagram'],
		map: ({ classification, canonicalUrl, metadata }) => {
			if (classification.subtype === 'profile') {
				return buildInstagramProfileOpenGraphAtom({
					canonicalUrl,
					handle: toStringMaybe(classification.meta.handle),
					metadata,
				});
			}

			if (classification.subtype === 'video') {
				return buildInstagramMediaOpenGraphAtom({
					canonicalUrl,
					shortcode: toStringMaybe(classification.meta.shortcode),
					metadata,
					schemaType: 'VideoObject',
					fallbackTitlePrefix: 'Instagram Video',
				});
			}

			if (classification.subtype === 'post') {
				return buildInstagramMediaOpenGraphAtom({
					canonicalUrl,
					shortcode: toStringMaybe(classification.meta.shortcode),
					metadata,
					schemaType: 'ImageObject',
					fallbackTitlePrefix: 'Instagram Post',
				});
			}

			return null;
		},
	});
}

function resolveInstagramOpenGraphDescription(metadata: OpenGraphMetadata): string | undefined {
	const description = toStringMaybe(metadata.description) ?? toStringMaybe(metadata.title);
	if (!description) {
		return undefined;
	}

	if (description === 'Instagram') {
		return undefined;
	}

	return description;
}

function hasUsableInstagramOpenGraphSignal(metadata: OpenGraphMetadata): boolean {
	return !!(
		toStringMaybe(metadata.description) ||
		toStringMaybe(metadata.title) ||
		toStringMaybe(metadata.image)
	);
}

function buildInstagramProfileOpenGraphAtom(input: {
	canonicalUrl: string;
	handle?: string;
	metadata: OpenGraphMetadata;
}): ResolverAtom | null {
	const handle = input.handle;
	if (!handle || !hasUsableInstagramOpenGraphSignal(input.metadata)) {
		return null;
	}

	const description = resolveInstagramOpenGraphDescription(input.metadata);
	const name = toStringMaybe(input.metadata.title) ?? `Instagram @${handle}`;

	return withPlatformMetadata(
		{
			schemaType: 'SocialMediaAccount',
			category: 'person',
			title: name,
			description,
			canonicalId: `instagram:user:${handle.toLowerCase()}`,
			sameAs: [input.canonicalUrl],
			data: {
				'@context': 'https://schema.org/',
				'@type': 'SocialMediaAccount',
				name,
				username: handle,
				platform: 'instagram',
				url: input.canonicalUrl,
				sameAs: [input.canonicalUrl],
				...(description ? { description } : {}),
				...(input.metadata.image ? { image: input.metadata.image } : {}),
			},
		},
		'instagram',
		'profile',
		{
			pluginId: 'instagram',
			provider: 'instagram-opengraph',
			sourceUrl: input.canonicalUrl,
			resolutionMode: 'identity-only',
		}
	);
}

function buildInstagramMediaOpenGraphAtom(input: {
	canonicalUrl: string;
	shortcode?: string;
	metadata: OpenGraphMetadata;
	schemaType: 'VideoObject' | 'ImageObject';
	fallbackTitlePrefix: string;
}): ResolverAtom | null {
	if (!hasUsableInstagramOpenGraphSignal(input.metadata)) {
		return null;
	}

	const description = resolveInstagramOpenGraphDescription(input.metadata);
	const shortcode = input.shortcode ?? slugify(input.canonicalUrl);
	const name =
		toStringMaybe(input.metadata.title) ?? `${input.fallbackTitlePrefix} ${shortcode}`.trim();
	const idPrefix = input.schemaType === 'VideoObject' ? 'video' : 'post';

	return withPlatformMetadata(
		{
			schemaType: input.schemaType,
			category: 'thing',
			title: name,
			description,
			canonicalId: `instagram:${idPrefix}:${shortcode}`,
			sameAs: [input.canonicalUrl],
			data: {
				'@context': 'https://schema.org/',
				'@type': input.schemaType,
				name,
				...(input.schemaType === 'VideoObject'
					? { contentUrl: input.canonicalUrl }
					: { url: input.canonicalUrl }),
				sameAs: [input.canonicalUrl],
				...(description ? { description } : {}),
			},
		},
		'instagram',
		input.schemaType === 'VideoObject' ? 'video' : 'post',
		{
			pluginId: 'instagram',
			provider: 'instagram-opengraph',
			sourceUrl: input.canonicalUrl,
			resolutionMode: 'identity-only',
		}
	);
}
