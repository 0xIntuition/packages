import { describe, expect, it } from 'bun:test';
import { extractClassificationFields } from '../../src/extraction/extract';
import {
	createCoinGeckoPlugin,
	createEtherscanPlugin,
	createMusicBrainzPlugin,
	createOpenLibraryPlugin,
	createSpotifyPlugin,
	createTmdbPlugin,
	createWikidataPlugin,
} from '../../src/plugins/providers';
import { createPinAwareFetch } from '../../src/plugins/providers/__shared__/http';
import musicBrainzRecordingFixture from '../../src/plugins/providers/musicbrainz/__fixtures__/recording.json';
import openLibraryAuthorFixture from '../../src/plugins/providers/openlibrary/__fixtures__/author.json';
import openLibraryEditionFixture from '../../src/plugins/providers/openlibrary/__fixtures__/edition.json';
import openLibraryWorkFixture from '../../src/plugins/providers/openlibrary/__fixtures__/work.json';
import spotifyTrackFixture from '../../src/plugins/providers/spotify/__fixtures__/track.json';
import { createMockAtomInput, createMockPluginContext, createMockRequest } from '../../src/testing';

const FIXTURE_ISRC = 'USFIX2600001';
const FIXTURE_ADDRESS = '0x1111111111111111111111111111111111111111';

describe('provider identifier gates', () => {
	it('resolves an identifier-first ISRC through MusicBrainz and Spotify into music fields', async () => {
		const musicBrainzRequests: Array<{ headers: Headers; url: string }> = [];
		const musicBrainz = createMusicBrainzPlugin({
			fetch: createPinAwareFetch(async (url, init) => {
				musicBrainzRequests.push({ headers: new Headers(init?.headers), url: String(url) });
				return jsonResponse({
					recordings: [{ ...musicBrainzRecordingFixture, isrcs: [FIXTURE_ISRC] }],
				});
			}),
		});
		const spotifyRequests: string[] = [];
		const spotify = createSpotifyPlugin({
			clientId: 'fixture-client-id',
			clientSecret: 'fixture-client-secret',
			fetch: createPinAwareFetch(async (url) => {
				const href = String(url);
				spotifyRequests.push(href);
				if (href === 'https://accounts.spotify.com/api/token') {
					return jsonResponse({ access_token: 'fixture-token', expires_in: 3600 });
				}
				return jsonResponse({ tracks: { items: [spotifyTrackFixture.single] } });
			}),
		});
		const request = createMockRequest({
			input: createMockAtomInput({
				atomType: 'song',
				identifier: {
					iid: `int:isrc:${FIXTURE_ISRC}`,
					scheme: 'isrc',
					value: FIXTURE_ISRC,
				},
				hints: undefined,
				jsonLd: undefined,
			}),
		});

		expect(musicBrainz.supports(request)).toBe(true);
		expect(spotify.supports(request)).toBe(true);

		const context = createMockPluginContext();
		const musicBrainzArtifacts = await musicBrainz.enrich(request, context);
		const spotifyArtifacts = await spotify.enrich(request, context);
		const extracted = await extractClassificationFields({
			artifacts: [...musicBrainzArtifacts, ...spotifyArtifacts],
			classification: 'music-recording',
			fetcher: createPinAwareFetch(noNetwork),
			url: undefined as never,
		});

		expect(musicBrainzRequests).toHaveLength(1);
		expect(musicBrainzRequests[0]?.url).toBe(
			`https://musicbrainz.org/ws/2/isrc/${FIXTURE_ISRC}?fmt=json&inc=artist-credits%2Bisrcs`
		);
		expect(musicBrainzRequests[0]?.headers.get('User-Agent')).toBe(
			'IntuitionAtomEnrichment/1.0.0 (+https://intuition.systems; MusicBrainz recording lookup)'
		);
		expect(spotifyRequests).toEqual([
			'https://accounts.spotify.com/api/token',
			`https://api.spotify.com/v1/search?type=track&q=isrc%3A${FIXTURE_ISRC}`,
		]);
		expect(request.input.identifier).toEqual({
			iid: `int:isrc:${FIXTURE_ISRC}`,
			scheme: 'isrc',
			value: FIXTURE_ISRC,
		});
		expect(request.input.hints?.identifiers).toEqual({ isrc: FIXTURE_ISRC });
		expect(musicBrainzArtifacts[0]).toMatchObject({
			artifact_type: 'musicbrainz',
			data: {
				artistCredit: 'Acme Artist',
				isrcs: [FIXTURE_ISRC],
				name: 'Acme Theme',
			},
		});
		expect(spotifyArtifacts[0]).toMatchObject({
			artifact_type: 'spotify',
			data: {
				isrc: FIXTURE_ISRC,
				name: 'Fixture Track',
				type: 'track',
			},
		});
		expect(extracted.values).toMatchObject({
			byArtist: 'Fixture Artist',
			name: 'Fixture Track',
		});
	});

	it('allows song name search when JSON-LD has no literal MusicRecording type', () => {
		const plugin = createMusicBrainzPlugin({ fetch: createPinAwareFetch(noNetwork) });
		const request = createMockRequest({
			input: createMockAtomInput({
				atomType: 'song',
				hints: { name: 'Fixture Track' },
				jsonLd: {},
			}),
		});

		expect(plugin.supports(request)).toBe(true);
	});

	it('keeps every existing Spotify identifier hint gate working without a URL', () => {
		const plugin = createSpotifyPlugin({ fetch: createPinAwareFetch(noNetwork) });
		const identifiers = [
			['spotifyTrackId', 'trackFixture1234567890'],
			['spotifyAlbumId', 'albumFixture1234567890'],
			['spotifyArtistId', 'artistFixture123456789'],
			['spotifyPlaylistId', 'playlistFixture1234567'],
			['spotifyShowId', 'showFixture12345678901'],
			['spotifyEpisodeId', 'episodeFixture12345678'],
			['spotifyId', 'track:trackFixture1234567890'],
		] as const;

		for (const [key, value] of identifiers) {
			const request = createIdentifierOnlyRequest({ [key]: value });
			expect(plugin.supports(request)).toBe(true);
		}
	});

	it('hydrates OpenLibrary from an ISBN hint without a URL', async () => {
		const requestedUrls: string[] = [];
		const plugin = createOpenLibraryPlugin({
			fetch: createPinAwareFetch(async (url) => {
				const href = String(url);
				requestedUrls.push(href);
				if (href.includes('/isbn/9780140328721')) {
					return jsonResponse(openLibraryEditionFixture);
				}
				if (href.includes('/works/OL45804W')) {
					return jsonResponse(openLibraryWorkFixture);
				}
				return jsonResponse(openLibraryAuthorFixture);
			}),
			requestSpacingMs: 0,
		});
		const request = createIdentifierOnlyRequest({ isbn: '978-0-14-032872-1' });

		expect(plugin.supports(request)).toBe(true);
		const artifacts = await plugin.enrich(request, createMockPluginContext());

		expect(requestedUrls).toEqual([
			'https://openlibrary.org/isbn/9780140328721.json',
			'https://openlibrary.org/works/OL45804W.json',
			'https://openlibrary.org/authors/OL34184A.json',
		]);
		expect(artifacts[0]).toMatchObject({
			artifact_type: 'openlibrary',
			data: {
				authors: [{ name: 'Roald Dahl', olid: 'OL34184A' }],
				isbn13: ['9780140328721'],
				sourceKind: 'isbn',
				title: 'Fantastic Mr. Fox',
			},
		});
	});

	it('supports admissible provider hints without URLs, including licensed TMDB', () => {
		const cases = [
			[createWikidataPlugin({ fetch: createPinAwareFetch(noNetwork) }), { wikidata: 'Q42' }],
			[
				createTmdbPlugin({ apiKey: 'test-key', fetch: createPinAwareFetch(noNetwork) }),
				{ tmdb: 'movie:603' },
			],
			[
				createCoinGeckoPlugin({ fetch: createPinAwareFetch(noNetwork) }),
				{ address: FIXTURE_ADDRESS },
			],
			[
				createEtherscanPlugin({ fetch: createPinAwareFetch(noNetwork) }),
				{ address: FIXTURE_ADDRESS },
			],
		] as const;

		for (const [plugin, identifiers] of cases) {
			expect(plugin.supports(createIdentifierOnlyRequest(identifiers))).toBe(true);
		}
	});

	it('keeps the TMDB provider dormant for identifier-only inputs without a key', () => {
		const plugin = createTmdbPlugin({ apiKey: ' ', fetch: createPinAwareFetch(noNetwork) });
		expect(plugin.supports(createIdentifierOnlyRequest({ tmdb: 'movie:603' }))).toBe(false);
	});

	it('resolves a typed WD IID through split TWD-4 hints without a URL', () => {
		const plugin = createWikidataPlugin({ fetch: createPinAwareFetch(noNetwork) });
		const request = createMockRequest({
			input: createMockAtomInput({
				atomType: 'thing',
				hints: undefined,
				identifier: {
					iid: 'int:wd:film:Q25188',
					scheme: 'wd',
					value: 'film:Q25188',
				},
				jsonLd: undefined,
			}),
		});

		expect(plugin.supports(request)).toBe(true);
		expect(request.input.hints?.identifiers).toEqual({
			wd: 'Q25188',
			wikidata: 'Q25188',
			wdSlug: 'film',
		});
	});
});

function createIdentifierOnlyRequest(identifiers: Record<string, string>) {
	return createMockRequest({
		input: createMockAtomInput({
			hints: { identifiers },
			jsonLd: {},
		}),
	});
}

function jsonResponse(body: unknown): Response {
	return new Response(JSON.stringify(body), {
		headers: { 'content-type': 'application/json' },
	});
}

function noNetwork(): Promise<never> {
	return Promise.reject(new Error('network disabled in test'));
}
