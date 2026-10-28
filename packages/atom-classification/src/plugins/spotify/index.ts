import { projectIdentifierLadder } from '@0xintuition/iid-ladder';
import type { ResolverAtom } from '../../plugins';
import { slugify, toStringMaybe, tryParseUrl, withPlatformMetadata } from '../shared/helpers';
import {
	createPlatformPlugin,
	createPlatformStageOutcome,
	isPlatformStageMiss,
	isPlatformStageOutcome,
	type PlatformStageAdapter,
	type PlatformV0PluginOptions,
	type PlatformV0Profile,
} from '../shared/platform';

export type SpotifyPluginOptions = PlatformV0PluginOptions;
const SPOTIFY_PLUGIN_ID = 'spotify';
const SPOTIFY_RESOURCE_TYPES = ['track', 'album', 'artist', 'playlist', 'show', 'episode'] as const;
const SPOTIFY_LOCALE_PREFIX = /^intl-[a-z]{2}(?:-[a-z]{2})?$/i;
type SpotifyResourceType = (typeof SPOTIFY_RESOURCE_TYPES)[number];

export const spotifyProfile: PlatformV0Profile = {
	domain: 'spotify',
	display: {
		classificationSlugs: [
			'music-recording',
			'music-album',
			'music-group',
			'podcast-episode',
			'podcast-series',
		],
		exampleUrl: 'https://open.spotify.com/track/3n3Ppam7vgaVa1iaRUc9Lp',
		host: 'open.spotify.com',
		label: 'Spotify',
	},
	supportsOEmbed: true,
	classifier: {
		id: 'spotify-url-classifier',
		priority: 10,
		classify(input: string) {
			const parsed = tryParseUrl(input);
			if (!parsed || !parsed.hostname.endsWith('spotify.com')) {
				return null;
			}

			const segments = parsed.pathname.split('/').filter(Boolean);
			if (SPOTIFY_LOCALE_PREFIX.test(segments[0] ?? '')) {
				segments.shift();
			}
			if (segments.length < 2) {
				return null;
			}

			const resourceType = segments[0];
			const resourceId = segments[1];
			if (!resourceType || !resourceId) {
				return null;
			}

			if (!isSpotifyResourceType(resourceType)) {
				return null;
			}

			return {
				type: 'url' as const,
				domain: 'spotify',
				subtype: resourceType,
				confidence: 0.99,
				meta: {
					resourceType,
					resourceId,
					canonicalUrl: `https://open.spotify.com/${resourceType}/${resourceId}`,
				},
			};
		},
	},
	resolveGeneric({ classification, canonicalUrl, now }) {
		if (classification.subtype === 'track') {
			const resourceId = toStringMaybe(classification.meta.resourceId) ?? '';
			const name =
				toStringMaybe(classification.meta.trackName) ?? `Spotify Track ${resourceId}`.trim();
			const byArtist = toStringMaybe(classification.meta.byArtist);
			const inAlbum = toStringMaybe(classification.meta.inAlbum);
			return withPlatformMetadata(
				{
					schemaType: 'MusicRecording',
					category: 'song',
					title: name,
					canonicalId: `spotify:track:${resourceId || slugify(canonicalUrl)}`,
					sameAs: [canonicalUrl],
					data: {
						'@context': 'https://schema.org/',
						'@type': 'MusicRecording',
						name,
						sameAs: [canonicalUrl],
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
				},
				'spotify',
				classification.subtype,
				{
					pluginId: SPOTIFY_PLUGIN_ID,
					provider: 'spotify',
					fetchedAt: now,
					sourceUrl: canonicalUrl,
					confidence: classification.confidence,
				}
			);
		}

		if (classification.subtype === 'album') {
			const resourceId = toStringMaybe(classification.meta.resourceId) ?? '';
			const name =
				toStringMaybe(classification.meta.albumName) ?? `Spotify Album ${resourceId}`.trim();
			const byArtist = toStringMaybe(classification.meta.byArtist);
			return withPlatformMetadata(
				{
					schemaType: 'MusicAlbum',
					category: 'music-album',
					title: name,
					canonicalId: `spotify:album:${resourceId || slugify(canonicalUrl)}`,
					sameAs: [canonicalUrl],
					data: {
						'@context': 'https://schema.org/',
						'@type': 'MusicAlbum',
						name,
						sameAs: [canonicalUrl],
						...(byArtist
							? {
									byArtist,
								}
							: {}),
					},
				},
				'spotify',
				classification.subtype,
				{
					pluginId: SPOTIFY_PLUGIN_ID,
					provider: 'spotify',
					fetchedAt: now,
					sourceUrl: canonicalUrl,
					confidence: classification.confidence,
				}
			);
		}

		if (classification.subtype === 'artist') {
			const resourceId = toStringMaybe(classification.meta.resourceId) ?? '';
			const name =
				toStringMaybe(classification.meta.artistName) ?? `Spotify Artist ${resourceId}`.trim();
			return withPlatformMetadata(
				{
					schemaType: 'MusicGroup',
					category: 'artist',
					title: name,
					canonicalId: `spotify:artist:${resourceId || slugify(canonicalUrl)}`,
					sameAs: [canonicalUrl],
					data: {
						'@context': 'https://schema.org/',
						'@type': 'MusicGroup',
						name,
						sameAs: [canonicalUrl],
					},
				},
				'spotify',
				classification.subtype,
				{
					pluginId: SPOTIFY_PLUGIN_ID,
					provider: 'spotify',
					fetchedAt: now,
					sourceUrl: canonicalUrl,
					confidence: classification.confidence,
				}
			);
		}

		if (classification.subtype === 'playlist') {
			const resourceId = toStringMaybe(classification.meta.resourceId) ?? '';
			const name =
				toStringMaybe(classification.meta.playlistName) ?? `Spotify Playlist ${resourceId}`.trim();
			return withPlatformMetadata(
				{
					schemaType: 'MusicPlaylist',
					category: 'song',
					title: name,
					canonicalId: `spotify:playlist:${resourceId || slugify(canonicalUrl)}`,
					sameAs: [canonicalUrl],
					data: {
						'@context': 'https://schema.org/',
						'@type': 'MusicPlaylist',
						name,
						url: canonicalUrl,
						sameAs: [canonicalUrl],
					},
				},
				'spotify',
				classification.subtype,
				{
					pluginId: SPOTIFY_PLUGIN_ID,
					provider: 'spotify',
					fetchedAt: now,
					sourceUrl: canonicalUrl,
					confidence: classification.confidence,
					resolutionMode: 'identity-only',
				}
			);
		}

		if (classification.subtype === 'show') {
			const resourceId = toStringMaybe(classification.meta.resourceId) ?? '';
			const name =
				toStringMaybe(classification.meta.showName) ?? `Spotify Show ${resourceId}`.trim();
			return withPlatformMetadata(
				{
					schemaType: 'PodcastSeries',
					category: 'podcast',
					title: name,
					canonicalId: `spotify:show:${resourceId || slugify(canonicalUrl)}`,
					sameAs: [canonicalUrl],
					data: {
						'@context': 'https://schema.org/',
						'@type': 'PodcastSeries',
						name,
						url: canonicalUrl,
						sameAs: [canonicalUrl],
					},
				},
				'spotify',
				classification.subtype,
				{
					pluginId: SPOTIFY_PLUGIN_ID,
					provider: 'spotify',
					fetchedAt: now,
					sourceUrl: canonicalUrl,
					confidence: classification.confidence,
				}
			);
		}

		const resourceId = toStringMaybe(classification.meta.resourceId) ?? '';
		const name =
			toStringMaybe(classification.meta.episodeName) ?? `Spotify Episode ${resourceId}`.trim();
		return withPlatformMetadata(
			{
				schemaType: 'PodcastEpisode',
				category: 'podcast',
				title: name,
				canonicalId: `spotify:episode:${resourceId || slugify(canonicalUrl)}`,
				sameAs: [canonicalUrl],
				data: {
					'@context': 'https://schema.org/',
					'@type': 'PodcastEpisode',
					name,
					url: canonicalUrl,
					sameAs: [canonicalUrl],
				},
			},
			'spotify',
			classification.subtype,
			{
				pluginId: SPOTIFY_PLUGIN_ID,
				provider: 'spotify',
				fetchedAt: now,
				sourceUrl: canonicalUrl,
				confidence: classification.confidence,
			}
		);
	},
};

function isSpotifyResourceType(value: string): value is SpotifyResourceType {
	return SPOTIFY_RESOURCE_TYPES.includes(value as SpotifyResourceType);
}

export function createSpotifyPlugin(options: SpotifyPluginOptions = {}) {
	return createPlatformPlugin({
		pluginId: 'spotify',
		resolverId: 'spotify-resolver',
		profile: spotifyProfile,
		options: {
			...options,
			adapters: {
				...options.adapters,
				domainApi: wrapSpotifyMediaAdapter(options.adapters?.domainApi, true),
				domainHtml: wrapSpotifyMediaAdapter(options.adapters?.domainHtml),
				publicMetadata: wrapSpotifyMediaAdapter(options.adapters?.publicMetadata),
				oEmbed: wrapSpotifyMediaAdapter(options.adapters?.oEmbed),
				openGraph: wrapSpotifyMediaAdapter(options.adapters?.openGraph),
			},
		},
	});
}

const SPOTIFY_MEDIA_IDENTITY = {
	track: {
		schemaType: 'MusicRecording',
	},
	album: {
		schemaType: 'MusicAlbum',
	},
	playlist: {
		schemaType: 'MusicPlaylist',
	},
} as const;

const ISRC_PATTERN = /^[A-Z]{2}[A-Z0-9]{3}\d{7}$/;

type SpotifyMediaSubtype = keyof typeof SPOTIFY_MEDIA_IDENTITY;

function wrapSpotifyMediaAdapter(
	adapter: PlatformStageAdapter | undefined,
	allowStrongIsrc = false
): PlatformStageAdapter | undefined {
	if (!adapter) {
		return undefined;
	}

	return async (input) => {
		const atom = await Promise.resolve(adapter(input));
		if (isPlatformStageOutcome(atom)) {
			if (!atom.atom || !isSpotifyMediaSubtype(input.classification.subtype)) {
				return atom;
			}

			return createPlatformStageOutcome(
				normalizeSpotifyMediaIdentity(atom.atom, {
					allowStrongIsrc,
					subtype: input.classification.subtype,
					canonicalUrl: input.canonicalUrl,
					resourceId: toStringMaybe(input.classification.meta.resourceId),
				}),
				atom.diagnostics
			);
		}
		if (
			!atom ||
			isPlatformStageMiss(atom) ||
			!isSpotifyMediaSubtype(input.classification.subtype)
		) {
			return atom;
		}

		return normalizeSpotifyMediaIdentity(atom, {
			allowStrongIsrc,
			subtype: input.classification.subtype,
			canonicalUrl: input.canonicalUrl,
			resourceId: toStringMaybe(input.classification.meta.resourceId),
		});
	};
}

function isSpotifyMediaSubtype(value: string): value is SpotifyMediaSubtype {
	return value in SPOTIFY_MEDIA_IDENTITY;
}

function normalizeSpotifyMediaIdentity(
	atom: ResolverAtom,
	input: {
		allowStrongIsrc: boolean;
		subtype: SpotifyMediaSubtype;
		canonicalUrl: string;
		resourceId?: string;
	}
): ResolverAtom {
	const resourceId = input.resourceId ?? slugify(input.canonicalUrl);
	const name = toStringMaybe(atom.data?.name) ?? atom.title;
	const schemaType = SPOTIFY_MEDIA_IDENTITY[input.subtype].schemaType;
	const providerCanonicalId = `spotify:${input.subtype}:${resourceId}`;
	const isrcCode =
		input.allowStrongIsrc && input.subtype === 'track'
			? canonicalizeIsrc(toStringMaybe(atom.data?.isrcCode))
			: undefined;
	const strongIdentity = isrcCode
		? projectIdentifierLadder({
				strongIdentifiers: { isrc: isrcCode },
				strongIdentifierOrder: ['isrc'],
			})
		: undefined;
	const canonicalId = strongIdentity?.iid ?? providerCanonicalId;

	return {
		...atom,
		schemaType,
		category: input.subtype === 'album' ? 'music-album' : 'song',
		title: name,
		canonicalId,
		sameAs: [input.canonicalUrl],
		hints: {
			...(atom.hints ?? {}),
			providerCanonicalIds: [providerCanonicalId],
			...(isrcCode
				? {
						identifiers: {
							...((atom.hints?.identifiers as Record<string, unknown> | undefined) ?? {}),
							isrc: isrcCode,
							spotifyTrackId: resourceId,
						},
					}
				: {}),
		},
		data: {
			...(atom.data ?? {}),
			'@context': 'https://schema.org/',
			'@type': schemaType,
			name,
			...(isrcCode ? { isrcCode } : {}),
			...(strongIdentity?.iid ? { identifier: strongIdentity.iid } : {}),
			sameAs: [input.canonicalUrl],
			...(input.subtype === 'playlist' ? { url: input.canonicalUrl } : {}),
		},
	};
}

function canonicalizeIsrc(value: string | undefined): string | undefined {
	if (!value) {
		return undefined;
	}
	const canonical = value
		.trim()
		.replace(/[\s-]+/g, '')
		.toUpperCase();
	return ISRC_PATTERN.test(canonical) ? canonical : undefined;
}

export type { SpotifyDomainApiAdapter, SpotifyDomainApiAdapterOptions } from './domain-api-adapter';
export { createSpotifyDomainApiAdapter } from './domain-api-adapter';
