import { describe, expect, it } from 'bun:test';
import { createPinAwareFetch, type FetchLike } from '../../src/plugins/providers/__shared__/http';
import {
	createAppleMusicPlugin,
	normalizeSongMatchText,
	parseAppleMusicUrl,
	parseApplePodcastsUrl,
	songDurationsMatch,
	songTextsMatch,
} from '../../src/plugins/providers/apple-music';
import type { EnrichmentRequest } from '../../src/types';

function request(url: string): EnrichmentRequest {
	return {
		input: {
			atomType: 'song',
			jsonLd: { '@context': 'https://schema.org/', '@type': 'MusicRecording', url },
			source: { classificationEngine: 'url-first-manual', classifiedAt: '2026-06-11T00:00:00Z' },
			hints: { url },
		},
		runtime: 'server',
	};
}

const ctx = { now: () => '2026-06-11T00:00:00.000Z', signal: undefined, logger: console } as never;

// Live-shape iTunes Lookup result (Jack Johnson — Better Together).
const SONG_RESULT = {
	wrapperType: 'track',
	kind: 'song',
	trackId: 1440857786,
	trackName: 'Better Together',
	artistName: 'Jack Johnson',
	collectionName: 'In Between Dreams (Bonus Track Version)',
	trackViewUrl: 'https://music.apple.com/us/album/better-together/1440857781?i=1440857786',
	artworkUrl100: 'https://is1-ssl.mzstatic.com/image/thumb/a/100x100bb.jpg',
	previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/preview.m4a',
	releaseDate: '2005-03-01T08:00:00Z',
	trackTimeMillis: 207679,
	primaryGenreName: 'Rock',
};

function lookupFetcher(results: unknown[]): FetchLike {
	return (url) => {
		if (!url.includes('itunes.apple.com/lookup')) {
			throw new Error(`unexpected fetch ${url}`);
		}
		return Promise.resolve(
			new Response(JSON.stringify({ resultCount: results.length, results }), {
				headers: { 'content-type': 'application/json' },
			})
		);
	};
}

describe('parseAppleMusicUrl', () => {
	it('parses album urls', () => {
		expect(
			parseAppleMusicUrl('https://music.apple.com/us/album/in-between-dreams/1440857781')
		).toEqual({ kind: 'lookup', id: '1440857781', country: 'us' });
	});

	it('prefers the track id from the i query parameter', () => {
		expect(
			parseAppleMusicUrl('https://music.apple.com/us/album/better-together/1440857781?i=1440857786')
		).toEqual({ kind: 'lookup', id: '1440857786', country: 'us' });
	});

	it('parses artist urls with non-us storefronts', () => {
		expect(parseAppleMusicUrl('https://music.apple.com/de/artist/jack-johnson/909253')).toEqual({
			kind: 'lookup',
			id: '909253',
			country: 'de',
		});
	});

	it('rejects non apple-music urls', () => {
		expect(parseAppleMusicUrl('https://open.spotify.com/track/abc')).toBeUndefined();
		expect(parseAppleMusicUrl('https://www.apple.com/')).toBeUndefined();
	});
});

describe('apple-music plugin', () => {
	it('maps a song lookup including previewUrl and upscaled artwork', async () => {
		const plugin = createAppleMusicPlugin({
			fetch: createPinAwareFetch(lookupFetcher([SONG_RESULT])),
		});
		const artifacts = await plugin.enrich(
			request('https://music.apple.com/us/album/better-together/1440857781?i=1440857786'),
			ctx
		);

		expect(artifacts).toHaveLength(1);
		expect(artifacts[0]?.data).toMatchObject({
			name: 'Better Together',
			type: 'song',
			appleMusicId: '1440857786',
			artistName: 'Jack Johnson',
			albumName: 'In Between Dreams (Bonus Track Version)',
			previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/preview.m4a',
			durationMs: 207679,
			genres: ['Rock'],
		});
		expect(artifacts[0]?.data.artworkUrl).toContain('600x600');
	});

	it('maps album lookups to the album type', async () => {
		const plugin = createAppleMusicPlugin({
			fetch: createPinAwareFetch(
				lookupFetcher([
					{
						wrapperType: 'collection',
						collectionId: 1440857781,
						collectionName: 'In Between Dreams',
						artistName: 'Jack Johnson',
						collectionViewUrl: 'https://music.apple.com/us/album/in-between-dreams/1440857781',
					},
				])
			),
		});
		const artifacts = await plugin.enrich(
			request('https://music.apple.com/us/album/in-between-dreams/1440857781'),
			ctx
		);
		expect(artifacts[0]?.data).toMatchObject({ name: 'In Between Dreams', type: 'album' });
	});

	it('returns nothing when the lookup has no results', async () => {
		const plugin = createAppleMusicPlugin({ fetch: createPinAwareFetch(lookupFetcher([])) });
		const artifacts = await plugin.enrich(
			request('https://music.apple.com/us/album/x/999999'),
			ctx
		);
		expect(artifacts).toHaveLength(0);
	});

	it('does not support non apple-music urls', () => {
		const plugin = createAppleMusicPlugin();
		expect(plugin.supports(request('https://example.com/'))).toBe(false);
	});
});

function isrcRequest(isrc: string): EnrichmentRequest {
	return {
		input: {
			atomType: 'song',
			jsonLd: { '@context': 'https://schema.org/', '@type': 'MusicRecording' },
			source: { classificationEngine: 'url-first-manual', classifiedAt: '2026-06-11T00:00:00Z' },
			hints: { identifiers: { isrc } },
		},
		runtime: 'server',
	};
}

// ENG-13713 round 5: the free iTunes `lookup?isrc=` endpoint does not support
// ISRC lookups (returns resultCount:0 for every ISRC), so the provider no
// longer exposes an ISRC target — a bare ISRC identifier does not activate it.
describe('isrc targets are not routed to the dead free-API endpoint', () => {
	it('does not support a request whose only signal is an ISRC identifier', () => {
		const plugin = createAppleMusicPlugin();
		expect(plugin.supports(isrcRequest('USUM70500916'))).toBe(false);
		expect(plugin.supports(isrcRequest('usum70500916'))).toBe(false);
	});

	it('never issues a lookup?isrc= request (would waste a guaranteed-empty call)', async () => {
		const fetch: FetchLike = (url) => {
			throw new Error(`unexpected fetch ${url}`);
		};
		const plugin = createAppleMusicPlugin({ fetch: createPinAwareFetch(fetch) });
		expect(await plugin.enrich(isrcRequest('USUM70500916'), ctx)).toEqual([]);
	});
});

const PODCAST_RESULT = {
	wrapperType: 'track',
	kind: 'podcast',
	collectionId: 360084272,
	trackId: 360084272,
	collectionName: 'The Joe Rogan Experience',
	artistName: 'Joe Rogan',
	collectionViewUrl: 'https://podcasts.apple.com/us/podcast/the-joe-rogan-experience/id360084272',
	feedUrl: 'https://feeds.megaphone.fm/GLT1412515089',
	artworkUrl100: 'https://is1-ssl.mzstatic.com/image/thumb/p/100x100bb.jpg',
	primaryGenreName: 'Comedy',
};

function searchFetcher(results: unknown[]): FetchLike {
	return (url) => {
		if (!url.includes('itunes.apple.com/search')) {
			throw new Error(`unexpected fetch ${url}`);
		}
		return Promise.resolve(
			new Response(JSON.stringify({ resultCount: results.length, results }), {
				headers: { 'content-type': 'application/json' },
			})
		);
	};
}

function searchRequest(value: string): EnrichmentRequest {
	return {
		input: {
			atomType: 'thing',
			jsonLd: { '@context': 'https://schema.org/', '@type': 'PodcastSeries' },
			source: { classificationEngine: 'url-first-manual', classifiedAt: '2026-06-11T00:00:00Z' },
			hints: { identifiers: { itunesPodcastSearch: value } },
		},
		runtime: 'server',
	};
}

describe('apple podcasts support', () => {
	it('parses apple podcasts urls into podcast lookups', () => {
		expect(
			parseApplePodcastsUrl(
				'https://podcasts.apple.com/us/podcast/the-joe-rogan-experience/id360084272'
			)
		).toEqual({ kind: 'lookup', id: '360084272', country: 'us', media: 'podcast' });
		expect(parseApplePodcastsUrl('https://podcasts.apple.com/us/browse')).toBeUndefined();
	});

	it('maps a podcast lookup result with its rss feedUrl', async () => {
		const plugin = createAppleMusicPlugin({
			fetch: createPinAwareFetch(lookupFetcher([PODCAST_RESULT])),
		});
		const artifacts = await plugin.enrich(
			request('https://podcasts.apple.com/us/podcast/the-joe-rogan-experience/id360084272'),
			ctx
		);
		expect(artifacts).toHaveLength(1);
		const data = artifacts[0]?.data as Record<string, unknown>;
		expect(data.type).toBe('podcast');
		expect(data.name).toBe('The Joe Rogan Experience');
		expect(data.feedUrl).toBe('https://feeds.megaphone.fm/GLT1412515089');
	});

	it('accepts a gated podcast search only when title and publisher corroborate', async () => {
		const plugin = createAppleMusicPlugin({
			fetch: createPinAwareFetch(searchFetcher([PODCAST_RESULT])),
		});
		const matched = await plugin.enrich(searchRequest('The Joe Rogan Experience|Joe Rogan'), ctx);
		expect(matched).toHaveLength(1);
		expect((matched[0]?.data as Record<string, unknown>).appleMusicId).toBe('360084272');

		// Same title, wrong publisher → the gate refuses. Blank beats wrong.
		const refused = await plugin.enrich(
			searchRequest('The Joe Rogan Experience|Somebody Else'),
			ctx
		);
		expect(refused).toEqual([]);

		// Different title entirely → refused.
		const mismatch = await plugin.enrich(searchRequest('Lex Fridman Podcast|Lex Fridman'), ctx);
		expect(mismatch).toEqual([]);
	});
});

function songSearchRequest(value: string): EnrichmentRequest {
	return {
		input: {
			atomType: 'song',
			jsonLd: { '@context': 'https://schema.org/', '@type': 'MusicRecording' },
			source: {
				classificationEngine: 'trpc-resolve-track-preview',
				classifiedAt: '2026-07-20T00:00:00Z',
			},
			hints: { identifiers: { itunesSongSearch: value } },
		},
		runtime: 'server',
	};
}

function songSearchFetcher(results: unknown[], seenUrls: string[] = []): FetchLike {
	return (url) => {
		if (!url.includes('itunes.apple.com/search')) {
			throw new Error(`unexpected fetch ${url}`);
		}
		seenUrls.push(url);
		return Promise.resolve(
			new Response(JSON.stringify({ resultCount: results.length, results }), {
				headers: { 'content-type': 'application/json' },
			})
		);
	};
}

describe('gated song searches (ENG-13713 round 4)', () => {
	it('supports name|artist identifiers but not term-only ones', () => {
		const plugin = createAppleMusicPlugin();
		expect(plugin.supports(songSearchRequest('Better Together|Jack Johnson'))).toBe(true);
		expect(plugin.supports(songSearchRequest('Better Together|Jack Johnson|207679'))).toBe(true);
		expect(plugin.supports(songSearchRequest('Better Together|'))).toBe(false);
	});

	it('searches the song catalog and accepts a fully corroborated result', async () => {
		const seenUrls: string[] = [];
		const plugin = createAppleMusicPlugin({
			fetch: createPinAwareFetch(songSearchFetcher([SONG_RESULT], seenUrls)),
		});

		const artifacts = await plugin.enrich(
			songSearchRequest('Better Together|Jack Johnson|207679'),
			ctx
		);

		expect(seenUrls[0]).toContain('media=music');
		expect(seenUrls[0]).toContain('entity=song');
		expect(seenUrls[0]).toContain(encodeURIComponent('Better Together Jack Johnson'));
		expect(artifacts).toHaveLength(1);
		expect(artifacts[0]?.data).toMatchObject({
			name: 'Better Together',
			type: 'song',
			appleMusicId: '1440857786',
			previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/preview.m4a',
			durationMs: 207679,
		});
		// The free API almost never carries an ISRC; without one the field is absent.
		expect((artifacts[0]?.data as Record<string, unknown>).isrc).toBeUndefined();
	});

	it('backfills an ISRC verbatim when a search result happens to carry one', async () => {
		const plugin = createAppleMusicPlugin({
			fetch: createPinAwareFetch(songSearchFetcher([{ ...SONG_RESULT, isrc: 'USUM70500916' }])),
		});

		const artifacts = await plugin.enrich(
			songSearchRequest('Better Together|Jack Johnson|207679'),
			ctx
		);

		expect(artifacts[0]?.data).toMatchObject({
			previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/preview.m4a',
			isrc: 'USUM70500916',
		});
	});

	it('accepts across Spotify dash qualifiers vs iTunes parenthetical qualifiers', async () => {
		const plugin = createAppleMusicPlugin({
			fetch: createPinAwareFetch(
				songSearchFetcher([{ ...SONG_RESULT, trackName: 'Better Together (Remastered 2011)' }])
			),
		});

		const artifacts = await plugin.enrich(
			songSearchRequest('Better Together - 2011 Remaster|Jack Johnson|207679'),
			ctx
		);

		expect(artifacts).toHaveLength(1);
	});

	it('refuses when the artist does not corroborate', async () => {
		const plugin = createAppleMusicPlugin({
			fetch: createPinAwareFetch(songSearchFetcher([SONG_RESULT])),
		});
		const artifacts = await plugin.enrich(
			songSearchRequest('Better Together|Milky Chance|207679'),
			ctx
		);
		expect(artifacts).toEqual([]);
	});

	it('refuses when the duration is more than 10s away', async () => {
		const plugin = createAppleMusicPlugin({
			fetch: createPinAwareFetch(songSearchFetcher([SONG_RESULT])),
		});
		const artifacts = await plugin.enrich(
			songSearchRequest('Better Together|Jack Johnson|230000'),
			ctx
		);
		expect(artifacts).toEqual([]);
	});

	it('refuses results that carry no preview — recovering one is the point', async () => {
		const { previewUrl: _omitted, ...withoutPreview } = SONG_RESULT;
		const plugin = createAppleMusicPlugin({
			fetch: createPinAwareFetch(songSearchFetcher([withoutPreview])),
		});
		const artifacts = await plugin.enrich(
			songSearchRequest('Better Together|Jack Johnson|207679'),
			ctx
		);
		expect(artifacts).toEqual([]);
	});
});

describe('song match normalization', () => {
	it('strips bracketed and dash qualifiers, punctuation, and case', () => {
		expect(normalizeSongMatchText('Better Together - 2011 Remaster')).toBe('better together');
		expect(normalizeSongMatchText('Better Together (feat. Someone) [Live]')).toBe(
			'better together'
		);
		expect(normalizeSongMatchText("Don't Stop Me Now!")).toBe('don t stop me now');
	});

	it('matches on equality or containment after normalization', () => {
		expect(songTextsMatch('Oh Devil - 2017 Remaster', 'Oh Devil (Remastered 2017)')).toBe(true);
		expect(songTextsMatch('Electric Guest', 'Electric Guest & Friends')).toBe(true);
		expect(songTextsMatch('Better Together', 'Banana Pancakes')).toBe(false);
		expect(songTextsMatch('', 'Banana Pancakes')).toBe(false);
	});

	it('applies the ±10s duration tolerance only when a duration is known', () => {
		expect(songDurationsMatch(207679, undefined)).toBe(true);
		expect(songDurationsMatch(undefined, undefined)).toBe(true);
		expect(songDurationsMatch(undefined, 207679)).toBe(false);
		expect(songDurationsMatch(207679 + 9999, 207679)).toBe(true);
		expect(songDurationsMatch(207679 + 10001, 207679)).toBe(false);
	});
});
