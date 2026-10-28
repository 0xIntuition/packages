import type { z } from 'zod/v4';
import { normalizeIsrc } from '../../../extraction/isrc';
import { recordEnrichmentPluginRetry } from '../../../plugin-tracing';
import { defineEnrichmentPlugin, type EnrichmentPlugin } from '../../../plugins';
import type { EnrichmentRequest } from '../../../types';
import type { FetchLike } from '../__shared__/http';
import { getIdentifier, getRequestName, getRequestUrl } from '../__shared__/request';
import {
	buildSpotifyBatchUrl,
	buildSpotifyIsrcSearchUrl,
	buildSpotifyItemUrl,
	describeSpotifyFailure,
	fetchSpotifyOEmbed,
	readSpotifyAccessToken,
	type SpotifyItemType,
	spotifyApiGetJson,
} from './client';
import {
	spotifyAlbumResponseSchema,
	spotifyAlbumsBatchResponseSchema,
	spotifyArtistResponseSchema,
	spotifyArtistsBatchResponseSchema,
	spotifyEpisodeResponseSchema,
	spotifyEpisodesBatchResponseSchema,
	spotifyPlaylistResponseSchema,
	spotifySearchResponseSchema,
	spotifyShowResponseSchema,
	spotifyShowsBatchResponseSchema,
	spotifyTrackResponseSchema,
	spotifyTracksBatchResponseSchema,
} from './external';
import { spotifyDataSchema } from './schema';

export { readSpotifyAccessToken };

type CreateSpotifyPluginOptions = {
	fetch?: FetchLike;
	priority?: number;
	TTL?: number;
	clientId?: string;
	clientSecret?: string;
	market?: string;
};

export type SpotifyTargetType = SpotifyItemType;

type SpotifyTarget = {
	type: SpotifyTargetType;
	id: string;
	url: string;
};

type SpotifyIsrcTarget = {
	type: 'isrc';
	isrc: string;
};

type ResolvedSpotifyRequest = SpotifyTarget | SpotifyIsrcTarget;

export type SpotifyBatchTargetType = Exclude<SpotifyTargetType, 'playlist'>;

export const SPOTIFY_BATCH_LIMITS: Record<SpotifyBatchTargetType, number> = {
	track: 50,
	album: 20,
	artist: 50,
	show: 50,
	episode: 50,
};

export type SpotifyBatchItem = {
	id: string;
	payload: Record<string, unknown> | null;
};

export type SpotifyBatchResult = {
	items: SpotifyBatchItem[];
	requestCount: 1 | 2;
};

export type SpotifyIdsShape = {
	count: number;
	nonMatchingEntries: string[];
};

export type ResolveSpotifyIdInput = {
	providerItemId?: string;
	type: SpotifyTargetType;
	urls: Array<string | undefined>;
};

export function createSpotifyPlugin(options: CreateSpotifyPluginOptions = {}): EnrichmentPlugin {
	const fetcher = options.fetch ?? (globalThis.fetch as FetchLike);

	return defineEnrichmentPlugin({
		id: 'spotify',
		version: '1.0.0',
		runtime: 'server',
		artifactTypes: ['spotify'],
		priority: options.priority ?? 48,
		TTL: options.TTL ?? 900,

		observability: {
			provider: 'spotify',
			// A cached run stands in for the one lookup it would have made.
			cacheOperations(request) {
				const resolved = resolveSpotifyRequest(request);
				if (!resolved) return [];
				const hasCredentials = Boolean(options.clientId?.trim() && options.clientSecret?.trim());
				if (resolved.type === 'isrc') return hasCredentials ? ['isrc_search'] : [];
				return [hasCredentials ? 'item' : 'oembed'];
			},
		},

		supports(request: EnrichmentRequest) {
			return !!resolveSpotifyRequest(request);
		},

		async enrich(request, ctx) {
			const resolved = resolveSpotifyRequest(request);
			if (!resolved) {
				return [];
			}

			const clientId = options.clientId?.trim();
			const clientSecret = options.clientSecret?.trim();
			if (resolved.type === 'isrc') {
				if (!clientId || !clientSecret) {
					return [];
				}

				try {
					const result = await fetchSpotifyIsrcData({
						clientId,
						clientSecret,
						ctx,
						fetcher,
						isrc: resolved.isrc,
						market: options.market,
					});
					if (!result) {
						return [];
					}

					return [
						{
							artifact_type: 'spotify',
							data: result.data,
							meta: {
								pluginId: 'spotify',
								provider: 'spotify-web-api',
								fetchedAt: ctx.now(),
								sourceUrl: result.target.url,
							},
						},
					];
				} catch (error) {
					// Structured facts only: the ISRC identifies a recording and a raw error message can
					// echo the request, so neither is logged.
					ctx.logger?.warn('Spotify ISRC lookup failed.', describeSpotifyFailure(error));
					return [];
				}
			}

			const target = resolved;
			const fallbackData = buildFallbackData(request, target);
			const prefetched = request.providerPrefetch?.spotify;

			if (prefetched && prefetched.id === target.id && prefetched.type === target.type) {
				return [
					{
						artifact_type: 'spotify',
						data: {
							...fallbackData,
							...buildSpotifyData(target, prefetched.payload),
						},
						meta: {
							pluginId: 'spotify',
							provider: 'spotify-web-api',
							fetchedAt: ctx.now(),
							sourceUrl: target.url,
						},
					},
				];
			}

			if (!clientId || !clientSecret) {
				// Keyless tier: Spotify's public oEmbed serves real titles and
				// artwork — EXCEPT for shows, where the oEmbed title is the latest
				// episode's title (verified live). Keep the artwork, drop the
				// misleading name; the Web API path returns the true show name.
				const oembed = await fetchSpotifyOEmbedData(fetcher, target.url, ctx);
				// Show oEmbed titles are the LATEST EPISODE's title (verified
				// live) — keep the artwork, never the misleading name.
				const oembedName = target.type === 'show' ? undefined : oembed.name;
				return [
					{
						artifact_type: 'spotify',
						data: {
							...fallbackData,
							...(oembedName ? { name: oembedName } : {}),
							...(oembed.imageUrl ? { imageUrl: oembed.imageUrl } : {}),
						},
						meta: {
							pluginId: 'spotify',
							provider: oembedName ? 'spotify-oembed' : 'spotify-url',
							fetchedAt: ctx.now(),
							sourceUrl: target.url,
						},
					},
				];
			}

			try {
				const data = await fetchSpotifyData({
					fetcher,
					target,
					clientId,
					clientSecret,
					ctx,
					market: options.market,
				});

				return [
					{
						artifact_type: 'spotify',
						data: {
							...fallbackData,
							...data,
						},
						meta: {
							pluginId: 'spotify',
							provider: 'spotify-web-api',
							fetchedAt: ctx.now(),
							sourceUrl: target.url,
						},
					},
				];
			} catch (error) {
				// The failed `item` request is already recorded with its real reason; oEmbed below
				// records its own outcome and the artifact tiers stay as they were.
				ctx.logger?.warn('Spotify metadata fetch failed; falling back to URL-derived payload.', {
					...describeSpotifyFailure(error),
					sourceUrl: target.url,
				});
				const oembed = await fetchSpotifyOEmbedData(fetcher, target.url, ctx);
				// Show oEmbed titles are the LATEST EPISODE's title (verified
				// live) — keep the artwork, never the misleading name.
				const oembedName = target.type === 'show' ? undefined : oembed.name;
				return [
					{
						artifact_type: 'spotify',
						data: {
							...fallbackData,
							...(oembedName ? { name: oembedName } : {}),
							...(oembed.imageUrl ? { imageUrl: oembed.imageUrl } : {}),
						},
						meta: {
							pluginId: 'spotify',
							provider: 'spotify-url',
							fetchedAt: ctx.now(),
							sourceUrl: target.url,
						},
					},
				];
			}
		},
	});
}

function resolveSpotifyRequest(request: EnrichmentRequest): ResolvedSpotifyRequest | undefined {
	const prefetched = request.providerPrefetch?.spotify;
	if (prefetched && isValidSpotifyId(prefetched.id)) {
		return createTargetFromIdentifier(prefetched.type, prefetched.id);
	}

	const url = getRequestUrl(request);
	if (url) {
		const parsed = parseSpotifyUrl(url);
		if (parsed) {
			return parsed;
		}
	}

	const isrc = normalizeIsrc(getIdentifier(request, 'isrc'));
	if (isrc) {
		return { type: 'isrc', isrc };
	}

	const trackId = getIdentifier(request, 'spotifyTrackId');
	if (trackId && isValidSpotifyId(trackId)) {
		return createTargetFromIdentifier('track', trackId);
	}

	const albumId = getIdentifier(request, 'spotifyAlbumId');
	if (albumId && isValidSpotifyId(albumId)) {
		return createTargetFromIdentifier('album', albumId);
	}

	const artistId = getIdentifier(request, 'spotifyArtistId');
	if (artistId && isValidSpotifyId(artistId)) {
		return createTargetFromIdentifier('artist', artistId);
	}

	const playlistId = getIdentifier(request, 'spotifyPlaylistId');
	if (playlistId && isValidSpotifyId(playlistId)) {
		return createTargetFromIdentifier('playlist', playlistId);
	}

	const showId = getIdentifier(request, 'spotifyShowId');
	if (showId && isValidSpotifyId(showId)) {
		return createTargetFromIdentifier('show', showId);
	}

	const episodeId = getIdentifier(request, 'spotifyEpisodeId');
	if (episodeId && isValidSpotifyId(episodeId)) {
		return createTargetFromIdentifier('episode', episodeId);
	}

	const rawSpotifyId = getIdentifier(request, 'spotifyId');
	if (!rawSpotifyId) {
		return undefined;
	}

	const parsedRaw = parseSpotifyIdentifier(rawSpotifyId);
	if (parsedRaw) {
		return parsedRaw;
	}

	return undefined;
}

export function resolveSpotifyId(input: ResolveSpotifyIdInput): string | undefined {
	const providerItemId = normalizeSpotifyId(input.providerItemId ?? '');
	if (isValidSpotifyId(providerItemId)) {
		return providerItemId;
	}

	for (const url of input.urls) {
		if (!url) {
			continue;
		}
		const target = parseSpotifyUrl(url);
		if (target?.type === input.type) {
			return target.id;
		}
	}

	return undefined;
}

function createTargetFromIdentifier(type: SpotifyTargetType, id: string): SpotifyTarget {
	const normalizedId = normalizeSpotifyId(id);
	return {
		type,
		id: normalizedId,
		url: toSpotifyCanonicalUrl(type, normalizedId),
	};
}

function parseSpotifyIdentifier(value: string): SpotifyTarget | undefined {
	const normalized = value.trim();
	const canonicalPattern = /^(track|album|artist|playlist|show|episode):([A-Za-z0-9]+)$/i;
	const canonicalMatch = normalized.match(canonicalPattern);
	if (canonicalMatch?.[1] && canonicalMatch[2]) {
		const type = canonicalMatch[1].toLowerCase() as SpotifyTargetType;
		const id = normalizeSpotifyId(canonicalMatch[2]);
		if (!isValidSpotifyId(id)) {
			return undefined;
		}
		return {
			type,
			id,
			url: toSpotifyCanonicalUrl(type, id),
		};
	}

	const fullPattern = /^spotify:(track|album|artist|playlist|show|episode):([A-Za-z0-9]+)$/i;
	const fullMatch = normalized.match(fullPattern);
	if (fullMatch?.[1] && fullMatch[2]) {
		const type = fullMatch[1].toLowerCase() as SpotifyTargetType;
		const id = normalizeSpotifyId(fullMatch[2]);
		if (!isValidSpotifyId(id)) {
			return undefined;
		}
		return {
			type,
			id,
			url: toSpotifyCanonicalUrl(type, id),
		};
	}

	return undefined;
}

function parseSpotifyUrl(value: string): SpotifyTarget | undefined {
	try {
		const parsed = new URL(value);
		if (!parsed.hostname.endsWith('spotify.com')) {
			return undefined;
		}

		const segments = parsed.pathname.split('/').filter(Boolean);
		if (segments.length === 0) {
			return undefined;
		}

		const first = segments[0];
		const second = segments[1];
		const third = segments[2];

		if (!first) {
			return undefined;
		}

		// Some localized Spotify URLs may include locale as first path segment.
		const firstLooksLikeLocale = /^[a-z]{2}(?:-[A-Za-z]{2})?$/i.test(first);
		const kind = (firstLooksLikeLocale ? second : first) as SpotifyTargetType | undefined;
		const resourceId = firstLooksLikeLocale ? third : second;
		if (!kind || !resourceId) {
			return undefined;
		}
		if (!isSpotifyTargetType(kind)) {
			return undefined;
		}

		const normalizedId = normalizeSpotifyId(resourceId);
		if (!isValidSpotifyId(normalizedId)) {
			return undefined;
		}

		return {
			type: kind,
			id: normalizedId,
			url: toSpotifyCanonicalUrl(kind, normalizedId),
		};
	} catch {
		return undefined;
	}
}

const SPOTIFY_TARGET_TYPES = new Set(['track', 'album', 'artist', 'playlist', 'show', 'episode']);

function isSpotifyTargetType(value: string): value is SpotifyTargetType {
	return SPOTIFY_TARGET_TYPES.has(value);
}

function normalizeSpotifyId(value: string): string {
	return value.replace(/\/+$/, '').trim();
}

export function isValidSpotifyId(value: string): boolean {
	return /^[0-9A-Za-z]{22}$/.test(value);
}

export function inspectSpotifyIdsShape(ids: string[]): SpotifyIdsShape {
	return {
		count: ids.length,
		nonMatchingEntries: ids.map(normalizeSpotifyId).filter((id) => !isValidSpotifyId(id)),
	};
}

function toSpotifyCanonicalUrl(type: SpotifyTargetType, id: string): string {
	return `https://open.spotify.com/${type}/${id}`;
}

type SpotifyEnrichmentContext = {
	signal: AbortSignal;
	deadlineAtMs?: number | undefined;
};

/** A 401 refresh shows up on the enrichment span as a retry (`authentication_rejected`). */
function authRetryRecorder(signal: AbortSignal) {
	return () =>
		recordEnrichmentPluginRetry(signal, { attempt: 2, reason: 'authentication_rejected' });
}

async function fetchSpotifyIsrcData(params: {
	fetcher: FetchLike;
	isrc: string;
	clientId: string;
	clientSecret: string;
	ctx: SpotifyEnrichmentContext;
	market?: string | undefined;
}) {
	const payload = await spotifyApiGetJson({
		fetch: params.fetcher,
		clientId: params.clientId,
		clientSecret: params.clientSecret,
		url: buildSpotifyIsrcSearchUrl(params.isrc, params.market),
		schema: spotifySearchResponseSchema,
		operation: 'isrc_search',
		signal: params.ctx.signal,
		deadlineAtMs: params.ctx.deadlineAtMs,
		onAuthRetry: authRetryRecorder(params.ctx.signal),
		// An empty result is a miss, not a hit.
		outcomeOf: (value) => {
			const id = value.tracks?.items[0]?.id;
			return id && isValidSpotifyId(id) ? 'hit' : 'miss';
		},
	});
	const track = payload.tracks?.items[0];
	if (!track?.id || !isValidSpotifyId(track.id)) {
		return undefined;
	}

	const target = createTargetFromIdentifier('track', track.id);
	return {
		data: buildSpotifyData(target, track),
		target,
	};
}

const SPOTIFY_ITEM_SCHEMAS = {
	track: spotifyTrackResponseSchema,
	album: spotifyAlbumResponseSchema,
	artist: spotifyArtistResponseSchema,
	playlist: spotifyPlaylistResponseSchema,
	show: spotifyShowResponseSchema,
	episode: spotifyEpisodeResponseSchema,
} as const;

async function fetchSpotifyData(params: {
	fetcher: FetchLike;
	target: SpotifyTarget;
	clientId: string;
	clientSecret: string;
	ctx: SpotifyEnrichmentContext;
	market?: string | undefined;
}) {
	const payload = await spotifyApiGetJson({
		fetch: params.fetcher,
		clientId: params.clientId,
		clientSecret: params.clientSecret,
		url: buildSpotifyItemUrl({
			type: params.target.type,
			id: params.target.id,
			market: params.market,
		}),
		schema: SPOTIFY_ITEM_SCHEMAS[params.target.type],
		operation: 'item',
		signal: params.ctx.signal,
		deadlineAtMs: params.ctx.deadlineAtMs,
		onAuthRetry: authRetryRecorder(params.ctx.signal),
	});
	return buildSpotifyData(params.target, payload);
}

/** Requests a batch URL and parses the response with the given schema. */
type BatchRequest = <TSchema extends z.ZodTypeAny>(schema: TSchema) => Promise<z.infer<TSchema>>;
type BatchReader = (request: BatchRequest) => Promise<readonly unknown[]>;

/** A batch endpoint's reader: its response schema and the field that holds the items. */
function batchReader<TSchema extends z.ZodTypeAny>(
	schema: TSchema,
	pick: (payload: z.infer<TSchema>) => readonly unknown[]
): BatchReader {
	return async (request) => pick(await request(schema));
}

const SPOTIFY_BATCH_READERS: Record<SpotifyBatchTargetType, BatchReader> = {
	track: batchReader(spotifyTracksBatchResponseSchema, (payload) => payload.tracks),
	album: batchReader(spotifyAlbumsBatchResponseSchema, (payload) => payload.albums),
	artist: batchReader(spotifyArtistsBatchResponseSchema, (payload) => payload.artists),
	show: batchReader(spotifyShowsBatchResponseSchema, (payload) => payload.shows),
	episode: batchReader(spotifyEpisodesBatchResponseSchema, (payload) => payload.episodes),
};

export async function fetchSpotifyBatch(params: {
	clientId: string;
	clientSecret: string;
	fetch?: FetchLike;
	ids: string[];
	market?: string;
	signal?: AbortSignal;
	type: SpotifyBatchTargetType;
}): Promise<SpotifyBatchResult> {
	const fetcher = params.fetch ?? (globalThis.fetch as FetchLike);
	const ids = [...new Set(params.ids.map(normalizeSpotifyId).filter(isValidSpotifyId))];
	const limit = SPOTIFY_BATCH_LIMITS[params.type];
	if (ids.length < 1 || ids.length > limit) {
		throw new Error(`Spotify ${params.type} batch must contain 1-${limit} valid ids.`);
	}
	let requestCount: 1 | 2 = 1;
	const reader = SPOTIFY_BATCH_READERS[params.type];
	// The seed script runs outside a request: the batch shares the token flow, unobserved.
	const url = buildSpotifyBatchUrl({ type: params.type, ids, market: params.market });
	const items = await reader((schema) =>
		spotifyApiGetJson({
			fetch: fetcher,
			clientId: params.clientId.trim(),
			clientSecret: params.clientSecret.trim(),
			url,
			schema,
			signal: params.signal,
			onAuthRetry: () => {
				requestCount = 2;
			},
		})
	);
	return {
		items: ids.map((id, index) => ({ id, payload: asUnknownRecord(items[index]) ?? null })),
		requestCount,
	};
}

function buildSpotifyData(target: SpotifyTarget, rawPayload: unknown) {
	if (target.type === 'track') {
		const payload = spotifyTrackResponseSchema.parse(rawPayload);
		return spotifyDataSchema.parse({
			name: payload.name ?? `Spotify Track ${target.id}`,
			type: 'track',
			spotifyId: payload.id ?? target.id,
			spotifyUrl: payload.external_urls?.spotify ?? target.url,
			spotifyApiPayload: asUnknownRecord(payload),
			previewUrl: normalizeHttpUrl(payload.preview_url),
			imageUrl: normalizeHttpUrl(payload.album?.images?.[0]?.url),
			artists: normalizeArtists(payload.artists),
			albumName: payload.album?.name,
			releaseDate: payload.album?.release_date,
			durationMs: payload.duration_ms,
			popularity: payload.popularity,
			isrc: payload.external_ids?.isrc,
		});
	}
	if (target.type === 'album') {
		const payload = spotifyAlbumResponseSchema.parse(rawPayload);
		return spotifyDataSchema.parse({
			upc: payload.external_ids?.upc,
			ean: payload.external_ids?.ean,
			name: payload.name ?? `Spotify Album ${target.id}`,
			type: 'album',
			spotifyId: payload.id ?? target.id,
			spotifyUrl: payload.external_urls?.spotify ?? target.url,
			spotifyApiPayload: asUnknownRecord(payload),
			imageUrl: normalizeHttpUrl(payload.images?.[0]?.url),
			artists: normalizeArtists(payload.artists),
			releaseDate: payload.release_date,
			popularity: payload.popularity,
			genres: payload.genres,
		});
	}
	if (target.type === 'artist') {
		const payload = spotifyArtistResponseSchema.parse(rawPayload);
		return spotifyDataSchema.parse({
			name: payload.name ?? `Spotify Artist ${target.id}`,
			type: 'artist',
			spotifyId: payload.id ?? target.id,
			spotifyUrl: payload.external_urls?.spotify ?? target.url,
			spotifyApiPayload: asUnknownRecord(payload),
			imageUrl: normalizeHttpUrl(payload.images?.[0]?.url),
			popularity: payload.popularity,
			genres: payload.genres,
		});
	}
	if (target.type === 'playlist') {
		const payload = spotifyPlaylistResponseSchema.parse(rawPayload);
		return spotifyDataSchema.parse({
			name: payload.name ?? `Spotify Playlist ${target.id}`,
			type: 'playlist',
			spotifyId: payload.id ?? target.id,
			spotifyUrl: payload.external_urls?.spotify ?? target.url,
			spotifyApiPayload: asUnknownRecord(payload),
			imageUrl: normalizeHttpUrl(payload.images?.[0]?.url),
		});
	}
	if (target.type === 'show') {
		const payload = spotifyShowResponseSchema.parse(rawPayload);
		return spotifyDataSchema.parse({
			name: payload.name ?? `Spotify Show ${target.id}`,
			type: 'show',
			spotifyId: payload.id ?? target.id,
			spotifyUrl: payload.external_urls?.spotify ?? target.url,
			// Spotify's multi-get show objects deliberately omit the single-get
			// `episodes` sub-list. No artifact field reads it: `total_episodes`
			// remains authoritative, while episodes are enriched as candidates.
			spotifyApiPayload: asUnknownRecord(payload),
			imageUrl: normalizeHttpUrl(payload.images?.[0]?.url),
			description: payload.description,
			publisher: payload.publisher,
			totalEpisodes: payload.total_episodes,
			languages: payload.languages,
		});
	}
	const payload = spotifyEpisodeResponseSchema.parse(rawPayload);
	return spotifyDataSchema.parse({
		name: payload.name ?? `Spotify Episode ${target.id}`,
		type: 'episode',
		spotifyId: payload.id ?? target.id,
		spotifyUrl: payload.external_urls?.spotify ?? target.url,
		spotifyApiPayload: asUnknownRecord(payload),
		previewUrl: normalizeHttpUrl(payload.audio_preview_url),
		imageUrl: normalizeHttpUrl(payload.images?.[0]?.url),
		description: payload.description,
		releaseDate: payload.release_date,
		durationMs: payload.duration_ms,
		showName: payload.show?.name,
		showSpotifyId: payload.show?.id,
		showSpotifyUrl: normalizeHttpUrl(payload.show?.external_urls?.spotify),
	});
}

function normalizeArtists(
	artists: Array<{ id?: string; name?: string } | null | undefined> | undefined
) {
	return artists
		?.map((artist) => {
			if (!artist?.name || !artist.id) {
				return undefined;
			}
			return { name: artist.name, spotifyId: artist.id };
		})
		.filter((entry): entry is { name: string; spotifyId: string } => !!entry);
}

async function fetchSpotifyOEmbedData(
	fetcher: FetchLike,
	url: string,
	ctx: SpotifyEnrichmentContext
): Promise<{ name?: string; imageUrl?: string }> {
	try {
		const payload = await fetchSpotifyOEmbed({
			fetch: fetcher,
			url,
			signal: ctx.signal,
			deadlineAtMs: ctx.deadlineAtMs,
		});
		const imageUrl = normalizeHttpUrl(payload.thumbnail_url);
		return {
			...(payload.title ? { name: payload.title } : {}),
			...(imageUrl ? { imageUrl } : {}),
		};
	} catch {
		return {};
	}
}

function buildFallbackData(
	request: EnrichmentRequest,
	target: SpotifyTarget
): {
	name: string;
	type: SpotifyTargetType;
	spotifyId: string;
	spotifyUrl: string;
} {
	const inferredName = getRequestName(request);
	const defaultName = `${toTitleCase(target.type)} ${target.id}`;
	return {
		name: inferredName ?? defaultName,
		type: target.type,
		spotifyId: target.id,
		spotifyUrl: target.url,
	};
}

function normalizeHttpUrl(value: string | undefined | null): string | undefined {
	if (!value) {
		return undefined;
	}

	try {
		const parsed = new URL(value);
		if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
			return undefined;
		}
		return parsed.toString();
	} catch {
		return undefined;
	}
}

function asUnknownRecord(value: unknown): Record<string, unknown> | undefined {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		return undefined;
	}

	return value as Record<string, unknown>;
}

function toTitleCase(value: string): string {
	if (value.length === 0) {
		return value;
	}
	return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}
