import {
	buildSpotifyItemUrl,
	type FetchLike,
	spotifyApiGetJson,
	spotifyLooseObjectSchema,
} from '@0xintuition/atom-enrichment/spotify-client';
import type { ResolverAtom } from '../../plugins';
import { PLATFORM_STAGE_MISS, type PlatformStageAdapter } from '../shared/platform';
import { toProviderStageDiagnostic } from '../shared/provider-stage-diagnostic';

type SpotifyTargetType = 'track' | 'album' | 'artist' | 'playlist' | 'show' | 'episode';

type SpotifyTrackPayload = {
	id?: string;
	name?: string;
	external_ids?: {
		isrc?: string;
	};
	external_urls?: {
		spotify?: string;
	};
	artists?: Array<{ name?: string }>;
	album?: {
		name?: string;
	};
};

type SpotifyAlbumPayload = {
	external_ids?: { upc?: string; ean?: string };
	id?: string;
	name?: string;
	external_urls?: {
		spotify?: string;
	};
	artists?: Array<{ name?: string }>;
};

type SpotifyArtistPayload = {
	id?: string;
	name?: string;
	external_urls?: {
		spotify?: string;
	};
};

type SpotifyPlaylistPayload = {
	id?: string;
	name?: string;
	description?: string;
	external_urls?: {
		spotify?: string;
	};
	images?: Array<{ url?: string }>;
	owner?: {
		display_name?: string;
	};
	tracks?: {
		total?: number;
	};
};

type SpotifyShowPayload = {
	id?: string;
	name?: string;
	description?: string;
	html_description?: string;
	external_urls?: {
		spotify?: string;
	};
	images?: Array<{ url?: string }>;
	publisher?: string;
	total_episodes?: number;
	languages?: string[];
};

type SpotifyEpisodePayload = {
	id?: string;
	name?: string;
	description?: string;
	html_description?: string;
	audio_preview_url?: string | null;
	duration_ms?: number;
	release_date?: string;
	external_urls?: {
		spotify?: string;
	};
	images?: Array<{ url?: string }>;
	show?: {
		id?: string;
		name?: string;
		external_urls?: {
			spotify?: string;
		};
	};
};

type SpotifyPayload =
	| SpotifyTrackPayload
	| SpotifyAlbumPayload
	| SpotifyArtistPayload
	| SpotifyPlaylistPayload
	| SpotifyShowPayload
	| SpotifyEpisodePayload;

export type SpotifyDomainApiAdapterOptions = {
	clientId?: string;
	clientSecret?: string;
	/** Defaults to `US` for shows and episodes, which Spotify answers 404 without a market. */
	market?: string;
	/**
	 * Transport seam for fixtures: a pin-aware fetch (`createPinAwareFetch`). Any other fetcher,
	 * including the default `globalThis.fetch`, is ignored and the shared pinned transport dials.
	 */
	fetch?: FetchLike;
};

export type SpotifyDomainApiAdapter = PlatformStageAdapter;

export function createSpotifyDomainApiAdapter(
	options: SpotifyDomainApiAdapterOptions = {}
): SpotifyDomainApiAdapter {
	const fetcher = options.fetch ?? (globalThis.fetch as FetchLike);

	return async ({ domain, classification, canonicalUrl, credential, signal, deadlineAtMs }) => {
		if (domain !== 'spotify') {
			return PLATFORM_STAGE_MISS;
		}

		const targetType = normalizeSpotifyTargetType(classification.subtype);
		if (!targetType) {
			return PLATFORM_STAGE_MISS;
		}

		const resourceId =
			toStringMaybe(classification.meta.resourceId) ??
			extractSpotifyResourceIdFromUrl(canonicalUrl, targetType);
		if (!resourceId) {
			return PLATFORM_STAGE_MISS;
		}

		const clientId =
			toStringMaybe(options.clientId) ?? toStringMaybe(credential?.clientId) ?? undefined;
		const clientSecret =
			toStringMaybe(options.clientSecret) ?? toStringMaybe(credential?.clientSecret) ?? undefined;
		if (!clientId || !clientSecret) {
			return PLATFORM_STAGE_MISS;
		}

		// The shared client owns the token (cached across classification and enrichment), the
		// single 401 refresh, the pinned transport, the body cap and the `spotify` request metrics.
		// Its failures are structured `ProviderHttpError`s the stage runner turns into stage errors.
		const payload = await spotifyApiGetJson({
			fetch: fetcher,
			clientId,
			clientSecret,
			url: buildSpotifyItemUrl({ type: targetType, id: resourceId, market: options.market }),
			schema: spotifyLooseObjectSchema,
			operation: 'classify_item',
			signal,
			deadlineAtMs,
		}).then(
			(value) => value as SpotifyPayload,
			(error: unknown) => {
				throw toProviderStageDiagnostic(error, 'Spotify', { signal, deadlineAtMs });
			}
		);

		return (
			mapSpotifyPayloadToResolverAtom({
				targetType,
				resourceId,
				canonicalUrl,
				payload,
			}) ?? PLATFORM_STAGE_MISS
		);
	};
}

function normalizeSpotifyTargetType(value: string): SpotifyTargetType | undefined {
	if (
		value === 'track' ||
		value === 'album' ||
		value === 'artist' ||
		value === 'playlist' ||
		value === 'show' ||
		value === 'episode'
	) {
		return value;
	}

	return undefined;
}

function extractSpotifyResourceIdFromUrl(
	value: string,
	expectedType: SpotifyTargetType
): string | undefined {
	try {
		const parsed = new URL(value);
		if (!parsed.hostname.endsWith('spotify.com')) {
			return undefined;
		}

		const segments = parsed.pathname.split('/').filter(Boolean);
		if (segments.length < 2) {
			return undefined;
		}

		const first = segments[0];
		const second = segments[1];
		const third = segments[2];
		if (!first || !second) {
			return undefined;
		}

		const firstLooksLikeLocale = /^[a-z]{2}(?:-[A-Za-z]{2})?$/i.test(first);
		const targetType = (firstLooksLikeLocale ? second : first).toLowerCase();
		const resourceId = (firstLooksLikeLocale ? third : second) ?? '';

		if (targetType !== expectedType || resourceId.trim().length === 0) {
			return undefined;
		}

		return resourceId.trim();
	} catch {
		return undefined;
	}
}

function mapSpotifyPayloadToResolverAtom(input: {
	targetType: SpotifyTargetType;
	resourceId: string;
	canonicalUrl: string;
	payload:
		| SpotifyTrackPayload
		| SpotifyAlbumPayload
		| SpotifyArtistPayload
		| SpotifyPlaylistPayload
		| SpotifyShowPayload
		| SpotifyEpisodePayload;
}): ResolverAtom {
	if (input.targetType === 'track') {
		const payload = input.payload as SpotifyTrackPayload;
		const artistNames = extractArtistNames(payload.artists);
		const byArtist = artistNames.length > 0 ? artistNames.join(', ') : undefined;
		const inAlbum = toStringMaybe(payload.album?.name);
		const isrcCode = toStringMaybe(payload.external_ids?.isrc);
		const name = toStringMaybe(payload.name) ?? `Spotify Track ${input.resourceId}`;
		const spotifyUrl = toStringMaybe(payload.external_urls?.spotify) ?? input.canonicalUrl;
		const spotifyId = toStringMaybe(payload.id) ?? input.resourceId;

		return {
			schemaType: 'MusicRecording',
			category: 'song',
			title: name,
			canonicalId: `spotify:track:${spotifyId}`,
			sameAs: [spotifyUrl],
			data: {
				'@context': 'https://schema.org/',
				'@type': 'MusicRecording',
				name,
				sameAs: [spotifyUrl],
				...(isrcCode ? { isrcCode } : {}),
				...(byArtist
					? {
							byArtist,
						}
					: {}),
				...(inAlbum
					? {
							inAlbum,
						}
					: {}),
			},
			metadata: {
				pluginId: 'spotify',
				provider: 'spotify-web-api',
				sourceUrl: spotifyUrl,
				sourceFamily: 'domain-api',
			},
		};
	}

	if (input.targetType === 'album') {
		const payload = input.payload as SpotifyAlbumPayload;
		const artistNames = extractArtistNames(payload.artists);
		const byArtist = artistNames.length > 0 ? artistNames.join(', ') : undefined;
		const name = toStringMaybe(payload.name) ?? `Spotify Album ${input.resourceId}`;
		const spotifyUrl = toStringMaybe(payload.external_urls?.spotify) ?? input.canonicalUrl;
		const spotifyId = toStringMaybe(payload.id) ?? input.resourceId;

		return {
			schemaType: 'MusicAlbum',
			category: 'song',
			title: name,
			canonicalId: `spotify:album:${spotifyId}`,
			sameAs: [spotifyUrl],
			data: {
				...(payload.external_ids?.upc ? { upc: payload.external_ids.upc } : {}),
				...(payload.external_ids?.ean ? { ean: payload.external_ids.ean } : {}),
				'@context': 'https://schema.org/',
				'@type': 'MusicAlbum',
				name,
				sameAs: [spotifyUrl],
				...(byArtist
					? {
							byArtist,
						}
					: {}),
			},
			metadata: {
				pluginId: 'spotify',
				provider: 'spotify-web-api',
				sourceUrl: spotifyUrl,
				sourceFamily: 'domain-api',
			},
		};
	}

	if (input.targetType === 'artist') {
		const payload = input.payload as SpotifyArtistPayload;
		const name = toStringMaybe(payload.name) ?? `Spotify Artist ${input.resourceId}`;
		const spotifyUrl = toStringMaybe(payload.external_urls?.spotify) ?? input.canonicalUrl;
		const spotifyId = toStringMaybe(payload.id) ?? input.resourceId;

		return {
			schemaType: 'MusicGroup',
			category: 'song',
			title: name,
			canonicalId: `spotify:artist:${spotifyId}`,
			sameAs: [spotifyUrl],
			data: {
				'@context': 'https://schema.org/',
				'@type': 'MusicGroup',
				name,
				sameAs: [spotifyUrl],
			},
			metadata: {
				pluginId: 'spotify',
				provider: 'spotify-web-api',
				sourceUrl: spotifyUrl,
				sourceFamily: 'domain-api',
			},
		};
	}

	if (input.targetType === 'playlist') {
		const payload = input.payload as SpotifyPlaylistPayload;
		const name = toStringMaybe(payload.name) ?? `Spotify Playlist ${input.resourceId}`;
		const description = toStringMaybe(payload.description);
		const image = toStringMaybe(payload.images?.[0]?.url);
		const author = toStringMaybe(payload.owner?.display_name);
		const numTracks =
			typeof payload.tracks?.total === 'number' && Number.isFinite(payload.tracks.total)
				? payload.tracks.total
				: undefined;

		return {
			schemaType: 'MusicPlaylist',
			category: 'song',
			title: name,
			description,
			canonicalId: `spotify:playlist:${input.resourceId}`,
			sameAs: [input.canonicalUrl],
			data: {
				'@context': 'https://schema.org/',
				'@type': 'MusicPlaylist',
				name,
				url: input.canonicalUrl,
				sameAs: [input.canonicalUrl],
				...(description ? { description } : {}),
				...(image ? { image } : {}),
				...(author ? { author } : {}),
				...(numTracks === undefined ? {} : { numTracks }),
			},
			metadata: {
				pluginId: 'spotify',
				provider: 'spotify-web-api',
				sourceUrl: input.canonicalUrl,
				sourceFamily: 'domain-api',
				resolutionMode: 'enriched',
			},
		};
	}

	if (input.targetType === 'show') {
		const payload = input.payload as SpotifyShowPayload;
		const name = toStringMaybe(payload.name) ?? `Spotify Show ${input.resourceId}`;
		const description = toStringMaybe(payload.description);
		const spotifyUrl = toStringMaybe(payload.external_urls?.spotify) ?? input.canonicalUrl;
		const spotifyId = toStringMaybe(payload.id) ?? input.resourceId;

		return {
			schemaType: 'PodcastSeries',
			category: 'podcast',
			title: name,
			canonicalId: `spotify:show:${spotifyId}`,
			sameAs: [spotifyUrl],
			data: {
				'@context': 'https://schema.org/',
				'@type': 'PodcastSeries',
				name,
				url: spotifyUrl,
				sameAs: [spotifyUrl],
				...(description ? { description } : {}),
				...(payload.publisher ? { publisher: payload.publisher } : {}),
			},
			metadata: {
				pluginId: 'spotify',
				provider: 'spotify-web-api',
				sourceUrl: spotifyUrl,
				sourceFamily: 'domain-api',
			},
		};
	}

	const payload = input.payload as SpotifyEpisodePayload;
	const name = toStringMaybe(payload.name) ?? `Spotify Episode ${input.resourceId}`;
	const spotifyUrl = toStringMaybe(payload.external_urls?.spotify) ?? input.canonicalUrl;
	const spotifyId = toStringMaybe(payload.id) ?? input.resourceId;
	const showName = toStringMaybe(payload.show?.name);
	const showUrl = toStringMaybe(payload.show?.external_urls?.spotify);

	return {
		schemaType: 'PodcastEpisode',
		category: 'podcast',
		title: name,
		canonicalId: `spotify:episode:${spotifyId}`,
		sameAs: [spotifyUrl],
		data: {
			'@context': 'https://schema.org/',
			'@type': 'PodcastEpisode',
			name,
			url: spotifyUrl,
			sameAs: [spotifyUrl],
			...(payload.description ? { description: payload.description } : {}),
			...(payload.release_date ? { datePublished: payload.release_date } : {}),
			...(payload.duration_ms ? { durationMs: payload.duration_ms } : {}),
			...(showName || showUrl
				? {
						partOfSeries: {
							'@type': 'PodcastSeries',
							...(showName ? { name: showName } : {}),
							...(showUrl ? { url: showUrl } : {}),
						},
					}
				: {}),
		},
		metadata: {
			pluginId: 'spotify',
			provider: 'spotify-web-api',
			sourceUrl: spotifyUrl,
			sourceFamily: 'domain-api',
		},
	};
}

function extractArtistNames(artists: Array<{ name?: string }> | undefined): string[] {
	if (!artists || artists.length === 0) {
		return [];
	}

	return artists
		.map((artist) => toStringMaybe(artist.name))
		.filter((name): name is string => typeof name === 'string');
}

function toStringMaybe(value: unknown): string | undefined {
	return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}
