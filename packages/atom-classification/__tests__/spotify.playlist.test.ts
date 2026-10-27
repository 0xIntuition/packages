import { describe, expect, it } from 'bun:test';
import { useStubbedPublicDns } from '@0xintuition/atom-enrichment/testing';
import { createClassificationEngine } from '../src/engine';
import {
	createSpotifyDomainApiAdapter,
	createSpotifyPlugin,
	createV0TypeProfilesPlugin,
} from '../src/plugins/index';
import { legacySpotifyFetch } from './helpers/legacy-spotify-fetch';

// The shared provider hop resolves every target before it dials; no network is used.
useStubbedPublicDns();

const PLAYLIST_ID = '37i9dQZF1DXcBWIGoYBM5M';
const PLAYLIST_URL = `https://open.spotify.com/playlist/${PLAYLIST_ID}`;
const PLAYLIST_CANONICAL_ID = `spotify:playlist:${PLAYLIST_ID}`;
const TRACK_ID = '4iV5W9uYEdYUVa79Axb7Rh';
const TRACK_URL = `https://open.spotify.com/track/${TRACK_ID}`;
const TRACK_CANONICAL_ID = `spotify:track:${TRACK_ID}`;

async function classifyWithoutMetadata(input: string, classificationSessionId: string) {
	const engine = createClassificationEngine({
		onClassifierError: () => undefined,
		runtime: 'server',
		plugins: [createV0TypeProfilesPlugin(), createSpotifyPlugin()],
	});

	return engine.classify({
		input,
		mode: 'progressive',
		classificationSessionId,
	});
}

describe('Spotify playlist classification (ENG-13766)', () => {
	it('uses a deterministic URL-derived fallback when metadata is unavailable', async () => {
		const result = await classifyWithoutMetadata(PLAYLIST_URL, 'spotify-playlist-identity-only');
		const repeated = await classifyWithoutMetadata(
			`${PLAYLIST_URL}?si=ignored-share-token`,
			'spotify-playlist-identity-only-repeat'
		);

		expect(result.classification).toMatchObject({
			domain: 'spotify',
			subtype: 'playlist',
			meta: {
				resourceId: PLAYLIST_ID,
				canonicalUrl: PLAYLIST_URL,
			},
		});
		expect(result.resolved?.atoms[0]).toMatchObject({
			schemaType: 'MusicPlaylist',
			category: 'song',
			title: `Spotify Playlist ${PLAYLIST_ID}`,
			canonicalId: PLAYLIST_CANONICAL_ID,
			sameAs: [PLAYLIST_URL],
			data: {
				'@context': 'https://schema.org/',
				'@type': 'MusicPlaylist',
				name: `Spotify Playlist ${PLAYLIST_ID}`,
				url: PLAYLIST_URL,
				sameAs: [PLAYLIST_URL],
			},
		});
		expect({
			title: repeated.resolved?.atoms[0]?.title,
			name: repeated.resolved?.atoms[0]?.data?.name,
			canonicalId: repeated.resolved?.atoms[0]?.canonicalId,
		}).toEqual({
			title: `Spotify Playlist ${PLAYLIST_ID}`,
			name: `Spotify Playlist ${PLAYLIST_ID}`,
			canonicalId: PLAYLIST_CANONICAL_ID,
		});
	});

	it('uses Spotify API metadata for display while preserving the fallback canonicalId', async () => {
		const requestedUrls: string[] = [];
		const fetch = async (input: string) => {
			requestedUrls.push(input);

			if (input === 'https://accounts.spotify.com/api/token') {
				return {
					ok: true,
					status: 200,
					json: async () => ({ access_token: 'spotify-test-token' }),
				};
			}

			return {
				ok: true,
				status: 200,
				json: async () => ({
					id: 'metadata-must-not-own-identity',
					name: "Today's Top Hits",
					description: 'The hottest songs right now.',
					external_urls: {
						spotify: 'https://open.spotify.com/playlist/metadata-must-not-own-identity',
					},
					images: [{ url: 'https://i.scdn.co/image/playlist-cover' }],
					owner: { display_name: 'Spotify' },
					tracks: { total: 50 },
				}),
			};
		};
		const engine = createClassificationEngine({
			onClassifierError: () => undefined,
			runtime: 'server',
			plugins: [
				createV0TypeProfilesPlugin(),
				createSpotifyPlugin({
					credentials: {
						spotify: {
							clientId: 'spotify-client-id',
							clientSecret: 'spotify-client-secret',
						},
					},
					adapters: {
						domainApi: createSpotifyDomainApiAdapter({
							clientId: 'spotify-client-id',
							clientSecret: 'spotify-client-secret',
							market: 'US',
							fetch: legacySpotifyFetch(fetch),
						}),
					},
				}),
			],
		});

		const fallback = await classifyWithoutMetadata(
			PLAYLIST_URL,
			'spotify-playlist-canonical-fallback'
		);
		const result = await engine.classify({
			input: PLAYLIST_URL,
			mode: 'progressive',
			classificationSessionId: 'spotify-playlist-domain-api',
		});

		expect(requestedUrls).toEqual([
			'https://accounts.spotify.com/api/token',
			`https://api.spotify.com/v1/playlists/${PLAYLIST_ID}?market=US`,
		]);
		expect(result.resolved?.atoms[0]?.canonicalId).toBe(fallback.resolved?.atoms[0]?.canonicalId);
		expect(result.resolved?.atoms[0]).toMatchObject({
			schemaType: 'MusicPlaylist',
			category: 'song',
			title: "Today's Top Hits",
			description: 'The hottest songs right now.',
			canonicalId: PLAYLIST_CANONICAL_ID,
			sameAs: [PLAYLIST_URL],
			data: {
				'@type': 'MusicPlaylist',
				name: "Today's Top Hits",
				url: PLAYLIST_URL,
				sameAs: [PLAYLIST_URL],
				image: 'https://i.scdn.co/image/playlist-cover',
				author: 'Spotify',
				numTracks: 50,
			},
		});
	});

	it('uses OpenGraph metadata for playlist title/name without changing the canonicalId', async () => {
		const engine = createClassificationEngine({
			onClassifierError: () => undefined,
			runtime: 'server',
			plugins: [
				createV0TypeProfilesPlugin(),
				createSpotifyPlugin({
					adapters: {
						openGraph: () => ({
							schemaType: 'WebSite',
							category: 'thing',
							title: 'Road Trip Mix',
							canonicalId: 'opengraph:fetch-dependent',
							sameAs: ['https://example.com/fetch-dependent'],
							data: {
								name: 'Road Trip Mix',
							},
						}),
					},
				}),
			],
		});

		const result = await engine.classify({
			input: PLAYLIST_URL,
			mode: 'progressive',
			classificationSessionId: 'spotify-playlist-opengraph',
		});

		expect(result.resolved?.atoms[0]).toMatchObject({
			title: 'Road Trip Mix',
			canonicalId: PLAYLIST_CANONICAL_ID,
			data: {
				name: 'Road Trip Mix',
			},
		});
	});

	it('uses the same URL-owned identity and metadata-owned title mechanism as tracks', async () => {
		const fetch = async (input: string) => {
			if (input === 'https://accounts.spotify.com/api/token') {
				return {
					ok: true,
					status: 200,
					json: async () => ({ access_token: 'spotify-test-token' }),
				};
			}

			if (input.includes('/tracks/')) {
				return {
					ok: true,
					status: 200,
					json: async () => ({
						id: 'metadata-track-id-must-not-own-identity',
						name: 'API Track Title',
						external_urls: {
							spotify: 'https://open.spotify.com/track/metadata-track-id-must-not-own-identity',
						},
					}),
				};
			}

			return {
				ok: true,
				status: 200,
				json: async () => ({
					id: 'metadata-playlist-id-must-not-own-identity',
					name: 'API Playlist Title',
					external_urls: {
						spotify: 'https://open.spotify.com/playlist/metadata-playlist-id-must-not-own-identity',
					},
				}),
			};
		};
		const engine = createClassificationEngine({
			onClassifierError: () => undefined,
			runtime: 'server',
			plugins: [
				createV0TypeProfilesPlugin(),
				createSpotifyPlugin({
					credentials: {
						spotify: {
							clientId: 'spotify-client-id',
							clientSecret: 'spotify-client-secret',
						},
					},
					adapters: {
						domainApi: createSpotifyDomainApiAdapter({
							clientId: 'spotify-client-id',
							clientSecret: 'spotify-client-secret',
							fetch: legacySpotifyFetch(fetch),
						}),
					},
				}),
			],
		});

		const track = await engine.classify({
			input: TRACK_URL,
			mode: 'progressive',
			classificationSessionId: 'spotify-track-parity',
		});
		const playlist = await engine.classify({
			input: PLAYLIST_URL,
			mode: 'progressive',
			classificationSessionId: 'spotify-playlist-parity',
		});

		expect(track.resolved?.atoms[0]).toMatchObject({
			schemaType: 'MusicRecording',
			category: 'song',
			title: 'API Track Title',
			canonicalId: TRACK_CANONICAL_ID,
			sameAs: [TRACK_URL],
			data: {
				name: 'API Track Title',
				sameAs: [TRACK_URL],
			},
		});
		expect(playlist.resolved?.atoms[0]).toMatchObject({
			schemaType: 'MusicPlaylist',
			category: 'song',
			title: 'API Playlist Title',
			canonicalId: PLAYLIST_CANONICAL_ID,
			sameAs: [PLAYLIST_URL],
			data: {
				'@type': 'MusicPlaylist',
				name: 'API Playlist Title',
				url: PLAYLIST_URL,
				sameAs: [PLAYLIST_URL],
			},
		});
	});
});
