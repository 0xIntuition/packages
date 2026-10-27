import {
	fetchProviderJson,
	type PinAwareFetch,
	ProviderHttpError,
} from '@0xintuition/atom-enrichment/provider-fetch';
import { z } from 'zod/v4';
import type { ResolverAtom } from '../../plugins';
import { PLATFORM_STAGE_MISS, type PlatformStageAdapter } from '../shared/platform';
import { toProviderStageDiagnostic } from '../shared/provider-stage-diagnostic';
import { canonicalYouTubeVideoId } from './video-id';

/** An oEmbed answer is a few hundred bytes; 64 KiB is generous and far below the 1 MiB ceiling. */
const YOUTUBE_OEMBED_MAX_BYTES = 64 * 1024;

/**
 * What the endpoint answers for a private (401/403), missing (404) or deleted (410) video: nothing
 * for this id. One set drives both the metric (`miss`) and the stage result (`PLATFORM_STAGE_MISS`),
 * so the dashboard and `resolverErrors` never disagree.
 */
const YOUTUBE_NO_RECORD_STATUSES = [401, 403, 404, 410] as const;
const NO_RECORD_OUTCOMES = Object.fromEntries(
	YOUTUBE_NO_RECORD_STATUSES.map((status) => [status, 'miss' as const])
);

/** Only the fields the atom uses, each read tolerantly. A non-object body fails the parse. */
const youtubeOEmbedSchema = z.object({
	title: z.unknown().optional(),
	author_name: z.unknown().optional(),
	thumbnail_url: z.unknown().optional(),
});

export type YouTubeOEmbedAdapterOptions = {
	/**
	 * Transport seam for fixtures: a pin-aware fetch (`createPinAwareFetch`). A plain fetcher is a
	 * type error. Omit it for the shared pinned transport.
	 */
	fetch?: PinAwareFetch;
	endpoint?: string;
};

export type YouTubeOEmbedAdapter = PlatformStageAdapter;

export function createYouTubeOEmbedAdapter(
	options: YouTubeOEmbedAdapterOptions = {}
): YouTubeOEmbedAdapter {
	const endpoint = toStringMaybe(options.endpoint) ?? 'https://www.youtube.com/oembed';

	return async ({ domain, classification, canonicalUrl, signal, deadlineAtMs }) => {
		if (domain !== 'youtube') {
			return PLATFORM_STAGE_MISS;
		}

		if (classification.subtype !== 'video') {
			return PLATFORM_STAGE_MISS;
		}

		const videoId =
			toStringMaybe(classification.meta.videoId) ?? canonicalYouTubeVideoId(canonicalUrl);
		const oembedUrl = new URL(endpoint);
		oembedUrl.searchParams.set('url', canonicalUrl);
		oembedUrl.searchParams.set('format', 'json');

		// The guarded pinned fetch honours the stage signal, caps the body and records
		// `youtube|classify_oembed` (the enrichment `oembed|youtube` lookup is a separate series).
		let payload: z.infer<typeof youtubeOEmbedSchema>;
		try {
			payload = await fetchProviderJson({
				url: oembedUrl.toString(),
				fetch: options.fetch,
				headers: { accept: 'application/json' },
				signal,
				deadlineAtMs,
				maxResponseBytes: YOUTUBE_OEMBED_MAX_BYTES,
				schema: youtubeOEmbedSchema,
				observe: {
					provider: 'youtube',
					operation: 'classify_oembed',
					// A private, deleted or non-embeddable video: nothing for this id.
					statusOutcomes: NO_RECORD_OUTCOMES,
					classifyResult: (value) => (toStringMaybe(value.title) ? 'hit' : 'miss'),
				},
			});
		} catch (error) {
			if (
				error instanceof ProviderHttpError &&
				error.errorClass === 'provider_http_error' &&
				(YOUTUBE_NO_RECORD_STATUSES as readonly number[]).includes(error.status)
			) {
				return PLATFORM_STAGE_MISS;
			}
			throw toProviderStageDiagnostic(error, 'YouTube', { signal, deadlineAtMs });
		}

		const title = toStringMaybe(payload.title);
		if (!title) {
			return PLATFORM_STAGE_MISS;
		}

		const authorName = toStringMaybe(payload.author_name);
		const thumbnailUrl = toStringMaybe(payload.thumbnail_url);

		return {
			schemaType: 'VideoObject',
			category: 'thing',
			title,
			canonicalId: `youtube:video:${videoId ?? slugify(canonicalUrl)}`,
			sameAs: [canonicalUrl],
			data: {
				'@context': 'https://schema.org/',
				'@type': 'VideoObject',
				name: title,
				url: canonicalUrl,
				contentUrl: canonicalUrl,
				sameAs: [canonicalUrl],
				...(authorName
					? {
							author: authorName,
						}
					: {}),
				...(thumbnailUrl
					? {
							thumbnailUrl,
						}
					: {}),
			},
			metadata: {
				pluginId: 'youtube',
				provider: 'youtube-oembed',
				sourceUrl: canonicalUrl,
			},
		} satisfies ResolverAtom;
	};
}

function toStringMaybe(value: unknown): string | undefined {
	return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function slugify(value: string): string {
	return value
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/(^-|-$)/g, '');
}
