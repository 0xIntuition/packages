import { observeProviderRequest } from '@0xintuition/pipeline-runtime/provider-request-observation';
import { defineEnrichmentPlugin, type EnrichmentPlugin } from '../../../plugins';
import type { EnrichmentRequest } from '../../../types';
import { type FetchLike, fetchJsonWithSchema } from '../__shared__/http';
import { classifyProviderRequestError } from '../__shared__/provider-request-observer';
import { getIdentifier, getRequestName, getRequestUrl } from '../__shared__/request';
import { youTubeVideoResponseSchema } from './external';
import { youtubeDataSchema } from './schema';

type CreateYouTubePluginOptions = {
	fetch?: FetchLike;
	priority?: number;
	TTL?: number;
	apiKey?: string;
	/** Where `YOUTUBE_API_KEY` is read when `apiKey` is not passed. Default: `process.env`. */
	env?: Readonly<Record<string, string | undefined>>;
};

type YouTubeVideoResponse = {
	items?: Array<{
		id?: string;
		snippet?: {
			title?: string;
			description?: string;
			channelTitle?: string;
			channelId?: string;
			publishedAt?: string;
			thumbnails?: {
				default?: { url?: string };
				medium?: { url?: string };
				high?: { url?: string };
			};
			tags?: string[];
		};
		contentDetails?: { duration?: string };
		statistics?: { viewCount?: string; likeCount?: string };
		player?: { embedHtml?: string };
	}>;
};

const youtubeVideoIdPattern = /^[A-Za-z0-9_-]{11}$/;

/**
 * Dormant without `YOUTUBE_API_KEY`, exactly like TMDB: a keyless runtime makes no request and
 * moves no series (it used to call the API and collect a 403 on every run). The key stays
 * optional so every keyless runtime still builds the plugin.
 */
export function createYouTubePlugin(options: CreateYouTubePluginOptions = {}): EnrichmentPlugin {
	const fetcher = options.fetch ?? (globalThis.fetch as FetchLike);
	const apiKey = (options.apiKey ?? youtubeApiKeyFromEnv(options.env))?.trim();

	return defineEnrichmentPlugin({
		id: 'youtube',
		version: '1.0.0',
		runtime: 'server',
		artifactTypes: ['youtube'],
		priority: options.priority ?? 42,
		TTL: options.TTL ?? 3_600,

		observability: {
			provider: 'youtube',
			// A cached run stands in for the one lookup it would have made. Dormant: no lookup.
			cacheOperations(request) {
				return apiKey && resolveYouTubeVideoId(request) ? ['video'] : [];
			},
		},

		supports(request: EnrichmentRequest) {
			return Boolean(apiKey && resolveYouTubeVideoId(request));
		},

		async enrich(request, ctx) {
			const videoId = resolveYouTubeVideoId(request);
			if (!(videoId && apiKey)) {
				return [];
			}

			const query = new URLSearchParams({
				part: 'snippet,contentDetails,statistics,player',
				id: videoId,
				key: apiKey,
			});

			const payload = await observeProviderRequest(
				{
					provider: 'youtube',
					operation: 'video',
					context: { signal: ctx.signal, deadlineAtMs: ctx.deadlineAtMs },
					classifyError: classifyVideoError,
					// `videos.list` answers 200 with an empty `items` for an unknown or private id.
					classifyResult: (value) => (value.items?.[0] ? 'hit' : 'miss'),
				},
				() =>
					fetchJsonWithSchema(
						fetcher,
						`https://www.googleapis.com/youtube/v3/videos?${query.toString()}`,
						youTubeVideoResponseSchema,
						// The key rides in the URL: never follow a redirect with it (ENG-17014 review finding).
						{ redirect: 'error', signal: ctx.signal },
						// Read Google's error reason so only a key-related 400 is `auth_failed`.
						{ captureErrorCode: true }
					)
			);

			const item = payload.items?.[0];
			if (!item) {
				return [];
			}

			const snippet = item.snippet ?? {};
			const thumbnailUrl =
				snippet.thumbnails?.high?.url ??
				snippet.thumbnails?.medium?.url ??
				snippet.thumbnails?.default?.url;
			const sourceUrl = `https://www.youtube.com/watch?v=${videoId}`;

			return [
				{
					artifact_type: 'youtube',
					data: youtubeDataSchema.parse({
						videoId,
						title: snippet.title ?? videoId,
						description: snippet.description,
						channelTitle: snippet.channelTitle,
						channelId: snippet.channelId,
						publishedAt: snippet.publishedAt,
						thumbnailUrl,
						duration: item.contentDetails?.duration,
						viewCount: parseCount(item.statistics?.viewCount),
						likeCount: parseCount(item.statistics?.likeCount),
						tags: snippet.tags,
						embedHtml: item.player?.embedHtml,
					}),
					meta: {
						pluginId: 'youtube',
						provider: 'youtube',
						fetchedAt: ctx.now(),
						sourceUrl,
					},
				},
			];
		},
	});
}

function youtubeApiKeyFromEnv(env: CreateYouTubePluginOptions['env']): string | undefined {
	return (env ?? process.env).YOUTUBE_API_KEY;
}

/**
 * 403 is a revoked key or an exhausted quota. An invalid key is a 400 (observed live), but only
 * the Google reason `API_KEY_INVALID` / `API_KEY_EXPIRED` is the key: any other 400 is a malformed
 * request and is an ordinary `http_4xx`, so it never fires the auth alert.
 */
function classifyVideoError(error: unknown) {
	return classifyProviderRequestError(error, {
		statusOutcomes: {
			400: {
				byErrorCode: { API_KEY_INVALID: 'auth_failed', API_KEY_EXPIRED: 'auth_failed' },
				default: 'http_4xx',
			},
			403: 'auth_failed',
		},
	});
}

function resolveYouTubeVideoId(request: EnrichmentRequest): string | undefined {
	const identifier = getIdentifier(request, 'youtube', 'youtubeVideoId', 'videoId');
	if (identifier && youtubeVideoIdPattern.test(identifier)) {
		return identifier;
	}

	const url = getRequestUrl(request);
	if (url) {
		const fromUrl = parseYouTubeVideoIdFromUrl(url);
		if (fromUrl) {
			return fromUrl;
		}
	}

	const name = getRequestName(request);
	if (name && youtubeVideoIdPattern.test(name)) {
		return name;
	}

	return undefined;
}

function parseYouTubeVideoIdFromUrl(url: string): string | undefined {
	try {
		const parsed = new URL(url);
		const host = parsed.hostname.replace(/^www\./, '');

		if (host === 'youtu.be') {
			const candidate = parsed.pathname.replace(/^\//, '').split('/')[0];
			if (!candidate) {
				return undefined;
			}

			return youtubeVideoIdPattern.test(candidate) ? candidate : undefined;
		}

		if (host === 'youtube.com' || host === 'm.youtube.com') {
			const fromQuery = parsed.searchParams.get('v');
			if (fromQuery && youtubeVideoIdPattern.test(fromQuery)) {
				return fromQuery;
			}

			const shortsMatch = parsed.pathname.match(/^\/shorts\/([A-Za-z0-9_-]{11})/);
			if (shortsMatch?.[1]) {
				return shortsMatch[1];
			}

			const embedMatch = parsed.pathname.match(/^\/embed\/([A-Za-z0-9_-]{11})/);
			if (embedMatch?.[1]) {
				return embedMatch[1];
			}
		}

		return undefined;
	} catch {
		return undefined;
	}
}

function parseCount(value: string | undefined): number | undefined {
	if (!value) {
		return undefined;
	}

	const parsed = Number.parseInt(value, 10);
	return Number.isFinite(parsed) ? parsed : undefined;
}
