import { describe, expect, it } from 'bun:test';
import { createPinAwareFetch } from '../src/plugins/providers/__shared__/http';

import {
	createSpotifyPlugin,
	fetchSpotifyBatch,
	resolveSpotifyId,
} from '../src/plugins/providers/spotify';
import albumFixture from '../src/plugins/providers/spotify/__fixtures__/album.json';
import artistFixture from '../src/plugins/providers/spotify/__fixtures__/artist.json';
import episodeFixture from '../src/plugins/providers/spotify/__fixtures__/episode.json';
import showFixture from '../src/plugins/providers/spotify/__fixtures__/show.json';
import trackFixture from '../src/plugins/providers/spotify/__fixtures__/track.json';
import { createMockAtomInput, createMockPluginContext, createMockRequest } from '../src/testing';

describe('spotify enrichment provider', () => {
	it('shares exact URL-derived ids with batch prefetch and prefers a valid provider id', async () => {
		const urlId = trackFixture.batchItem.id;
		const providerId = 'trackFixture0987654321';
		const url = `https://open.spotify.com/track/${urlId}`;
		let fetchCalls = 0;
		const plugin = createSpotifyPlugin({
			fetch: createPinAwareFetch(async () => {
				fetchCalls += 1;
				return jsonResponse({ title: 'Fixture Track' });
			}),
		});
		const artifacts = await plugin.enrich(requestFor('track', urlId), createMockPluginContext());
		const preferredArtifacts = await plugin.enrich(
			createMockRequest({
				...requestFor('track', urlId),
				providerPrefetch: {
					spotify: {
						batchRequestId: 'provider-id-preference',
						batchSize: 1,
						id: providerId,
						payload: {
							...trackFixture.batchItem,
							external_urls: { spotify: `https://open.spotify.com/track/${providerId}` },
							id: providerId,
						},
						type: 'track',
					},
				},
			}),
			createMockPluginContext()
		);

		expect(resolveSpotifyId({ providerItemId: '', type: 'track', urls: [url] })).toBe(urlId);
		expect(artifacts[0]?.data.spotifyId).toBe(urlId);
		expect(resolveSpotifyId({ providerItemId: providerId, type: 'track', urls: [url] })).toBe(
			providerId
		);
		expect(preferredArtifacts[0]?.data.spotifyId).toBe(providerId);
		expect(fetchCalls).toBe(1);
		expect(
			resolveSpotifyId({
				providerItemId: 'invalidpid',
				type: 'track',
				urls: [url],
			})
		).toBe(urlId);
	});

	it('returns URL-derived fallback artifacts for podcast shows and episodes without credentials', async () => {
		// The URL-derived fallback is only taken when the oEmbed lookup fails, so
		// fail it deterministically — the default fetcher makes a live network
		// request whose timing (fast-fail locally, stall on CI) decided this test.
		const plugin = createSpotifyPlugin({
			fetch: createPinAwareFetch(() =>
				Promise.reject(new Error('offline: oEmbed unavailable in unit tests'))
			),
		});
		const ctx = createMockPluginContext();

		const showArtifacts = await plugin.enrich(
			createMockRequest({
				input: createMockAtomInput({
					hints: {
						name: 'Fallback Show',
						url: 'https://open.spotify.com/show/38bS44xjbVVZ3No3ByF1dJ',
					},
				}),
			}),
			ctx
		);
		const episodeArtifacts = await plugin.enrich(
			createMockRequest({
				input: createMockAtomInput({
					hints: {
						name: 'Fallback Episode',
						url: 'https://open.spotify.com/episode/512ojhOuo1ktJprKbVcKyQ',
					},
				}),
			}),
			ctx
		);

		expect(showArtifacts[0]?.data).toMatchObject({
			name: 'Fallback Show',
			type: 'show',
			spotifyId: '38bS44xjbVVZ3No3ByF1dJ',
			spotifyUrl: 'https://open.spotify.com/show/38bS44xjbVVZ3No3ByF1dJ',
		});
		expect(showArtifacts[0]?.meta.provider).toBe('spotify-url');
		expect(episodeArtifacts[0]?.data).toMatchObject({
			name: 'Fallback Episode',
			type: 'episode',
			spotifyId: '512ojhOuo1ktJprKbVcKyQ',
			spotifyUrl: 'https://open.spotify.com/episode/512ojhOuo1ktJprKbVcKyQ',
		});
		expect(episodeArtifacts[0]?.meta.provider).toBe('spotify-url');
	});

	it('maps Spotify Web API podcast payloads into structured artifacts', async () => {
		const requestedUrls: string[] = [];
		const plugin = createSpotifyPlugin({
			clientId: 'spotify-client-id',
			clientSecret: 'spotify-client-secret',
			market: 'US',
			fetch: createPinAwareFetch(async (input) => {
				const url = input.toString();
				requestedUrls.push(url);

				if (url === 'https://accounts.spotify.com/api/token') {
					return jsonResponse({
						access_token: 'spotify-test-token',
					});
				}

				if (url.includes('/shows/38bS44xjbVVZ3No3ByF1dJ')) {
					return jsonResponse({
						id: '38bS44xjbVVZ3No3ByF1dJ',
						name: 'Spotify Engineering Culture',
						description: 'A show about building audio products.',
						publisher: 'Spotify',
						total_episodes: 42,
						languages: ['en'],
						external_urls: {
							spotify: 'https://open.spotify.com/show/38bS44xjbVVZ3No3ByF1dJ',
						},
						images: [{ url: 'https://i.scdn.co/image/show' }],
					});
				}

				expect(url).toContain('/episodes/512ojhOuo1ktJprKbVcKyQ');
				return jsonResponse({
					id: '512ojhOuo1ktJprKbVcKyQ',
					name: 'Classifying Podcasts',
					description: 'A focused episode.',
					audio_preview_url: 'https://p.scdn.co/episode-preview.mp3',
					duration_ms: 1_800_000,
					release_date: '2026-05-01',
					external_urls: {
						spotify: 'https://open.spotify.com/episode/512ojhOuo1ktJprKbVcKyQ',
					},
					images: [{ url: 'https://i.scdn.co/image/episode' }],
					show: {
						id: '38bS44xjbVVZ3No3ByF1dJ',
						name: 'Spotify Engineering Culture',
						external_urls: {
							spotify: 'https://open.spotify.com/show/38bS44xjbVVZ3No3ByF1dJ',
						},
					},
				});
			}),
		});
		const ctx = createMockPluginContext();

		const showArtifacts = await plugin.enrich(
			createMockRequest({
				input: createMockAtomInput({
					hints: {
						url: 'https://open.spotify.com/show/38bS44xjbVVZ3No3ByF1dJ',
					},
				}),
			}),
			ctx
		);
		const episodeArtifacts = await plugin.enrich(
			createMockRequest({
				input: createMockAtomInput({
					hints: {
						url: 'https://open.spotify.com/episode/512ojhOuo1ktJprKbVcKyQ',
					},
				}),
			}),
			ctx
		);

		expect(requestedUrls).toContain(
			'https://api.spotify.com/v1/shows/38bS44xjbVVZ3No3ByF1dJ?market=US'
		);
		expect(requestedUrls.filter((url) => url.includes('/api/token'))).toHaveLength(1);
		expect(requestedUrls).toContain(
			'https://api.spotify.com/v1/episodes/512ojhOuo1ktJprKbVcKyQ?market=US'
		);
		expect(showArtifacts[0]?.data).toMatchObject({
			name: 'Spotify Engineering Culture',
			type: 'show',
			publisher: 'Spotify',
			totalEpisodes: 42,
			languages: ['en'],
			imageUrl: 'https://i.scdn.co/image/show',
		});
		expect(episodeArtifacts[0]?.data).toMatchObject({
			name: 'Classifying Podcasts',
			type: 'episode',
			previewUrl: 'https://p.scdn.co/episode-preview.mp3',
			durationMs: 1_800_000,
			releaseDate: '2026-05-01',
			showName: 'Spotify Engineering Culture',
			showSpotifyId: '38bS44xjbVVZ3No3ByF1dJ',
		});
	});

	for (const fixture of [
		{ type: 'track' as const, value: trackFixture },
		{ type: 'album' as const, value: albumFixture },
		{ type: 'artist' as const, value: artistFixture },
		{ type: 'episode' as const, value: episodeFixture },
	]) {
		it(`builds an identical ${fixture.type} artifact from single and batch payloads`, async () => {
			const single = await enrichFixtureFromSingle(fixture.type, fixture.value.single);
			const batch = await enrichFixtureFromBatch(fixture.type, fixture.value.batchItem);
			expect(batch).toEqual(single);
		});
	}

	it('preserves every show schema field while accepting the documented episodes payload delta', async () => {
		const single = await enrichFixtureFromSingle('show', showFixture.single);
		const batch = await enrichFixtureFromBatch('show', showFixture.batchItem);
		const singleData = single?.data ?? {};
		const batchData = batch?.data ?? {};
		const { spotifyApiPayload: singlePayload, ...singleSchemaFields } = singleData;
		const { spotifyApiPayload: batchPayload, ...batchSchemaFields } = batchData;

		expect(batchSchemaFields).toEqual(singleSchemaFields);
		const { episodes: singleEpisodes, ...singlePayloadWithoutEpisodes } = singlePayload as Record<
			string,
			unknown
		>;
		expect(batchPayload).toEqual(singlePayloadWithoutEpisodes);
		expect(singleEpisodes).toBeDefined();
		expect((batchPayload as Record<string, unknown>).episodes).toBeUndefined();
	});

	it('caches client-credentials tokens across batch requests', async () => {
		const urls: string[] = [];
		const fetcher = async (input: string) => {
			const url = input.toString();
			urls.push(url);
			if (url.includes('/api/token')) {
				return jsonResponse({ access_token: 'cached-batch-token', expires_in: 3600 });
			}
			if (url.includes('/v1/tracks?')) {
				return jsonResponse({ tracks: [trackFixture.batchItem] });
			}
			return jsonResponse({ albums: [albumFixture.batchItem] });
		};
		await fetchSpotifyBatch({
			clientId: 'batch-cache-client',
			clientSecret: 'batch-cache-secret',
			fetch: createPinAwareFetch(fetcher),
			ids: [trackFixture.batchItem.id],
			type: 'track',
		});
		await fetchSpotifyBatch({
			clientId: 'batch-cache-client',
			clientSecret: 'batch-cache-secret',
			fetch: createPinAwareFetch(fetcher),
			ids: [albumFixture.batchItem.id],
			type: 'album',
		});

		expect(urls.filter((url) => url.includes('/api/token'))).toHaveLength(1);
		expect(urls.filter((url) => url.includes('api.spotify.com/v1/'))).toHaveLength(2);
	});

	it('refreshes a cached token once after HTTP 401', async () => {
		let tokenRequests = 0;
		let dataRequests = 0;
		const plugin = createSpotifyPlugin({
			clientId: 'refresh-client',
			clientSecret: 'refresh-secret',
			fetch: createPinAwareFetch(async (input) => {
				const url = input.toString();
				if (url.includes('/api/token')) {
					tokenRequests += 1;
					return jsonResponse({ access_token: `refresh-token-${tokenRequests}`, expires_in: 3600 });
				}
				dataRequests += 1;
				if (dataRequests === 1) {
					return new Response('expired', { status: 401 });
				}
				return jsonResponse(trackFixture.single);
			}),
		});
		const request = requestFor('track', trackFixture.single.id);
		await plugin.enrich(request, createMockPluginContext());
		await plugin.enrich(request, createMockPluginContext());

		expect(tokenRequests).toBe(2);
		expect(dataRequests).toBe(3);
	});
});

type FixtureType = 'track' | 'album' | 'artist' | 'show' | 'episode';

async function enrichFixtureFromSingle(type: FixtureType, payload: Record<string, unknown>) {
	const id = String(payload.id);
	const plugin = createSpotifyPlugin({
		clientId: `single-${type}`,
		clientSecret: 'fixture-secret',
		fetch: createPinAwareFetch(async (input) => {
			const url = input.toString();
			return url.includes('/api/token')
				? jsonResponse({ access_token: `token-${type}`, expires_in: 3600 })
				: jsonResponse(payload);
		}),
	});
	const artifacts = await plugin.enrich(requestFor(type, id), createMockPluginContext());
	return artifacts[0];
}

async function enrichFixtureFromBatch(type: FixtureType, payload: Record<string, unknown>) {
	const id = String(payload.id);
	const plugin = createSpotifyPlugin();
	const artifacts = await plugin.enrich(
		createMockRequest({
			...requestFor(type, id),
			providerPrefetch: {
				spotify: {
					batchRequestId: `fixture-${type}-batch`,
					batchSize: 1,
					id,
					payload,
					type,
				},
			},
		}),
		createMockPluginContext()
	);
	return artifacts[0];
}

function requestFor(type: FixtureType, id: string) {
	return createMockRequest({
		input: createMockAtomInput({
			hints: { url: `https://open.spotify.com/${type}/${id}` },
		}),
	});
}

function jsonResponse(payload: unknown): Response {
	return new Response(JSON.stringify(payload), {
		status: 200,
		headers: {
			'content-type': 'application/json',
		},
	});
}
