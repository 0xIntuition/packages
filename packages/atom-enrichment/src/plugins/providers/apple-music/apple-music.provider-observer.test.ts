import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';
import {
	addProviderObserver,
	type ProviderEvent,
	type ProviderRequestEvent,
	resetProviderObserversForTests,
} from '@0xintuition/pipeline-runtime/provider-observer';

import { createMemoryCacheAdapter } from '../../../cache';
import { createEnrichmentEngine } from '../../../engine';
import { createMockAtomInput, createMockPluginContext, createMockRequest } from '../../../testing';
import { createPinAwareFetch, type FetchLike } from '../__shared__/http';
import { createAppleMusicPlugin as createProviderPlugin } from './index';

let events: ProviderEvent[];
const requests = () =>
	events.filter((event): event is ProviderRequestEvent => event.type === 'provider_request');
const tuples = () =>
	requests().map(({ operation, outcome, reason, source }) => ({
		operation,
		outcome,
		reason,
		source,
	}));
const tuple = (
	operation: ProviderRequestEvent['operation'],
	outcome: ProviderRequestEvent['outcome'],
	reason: ProviderRequestEvent['reason'] = 'none'
) => ({ operation, outcome, reason, source: 'live' as const });

beforeEach(() => {
	events = [];
	resetProviderObserversForTests();
	addProviderObserver((event) => {
		events.push(event);
	});
});
afterEach(() => resetProviderObserversForTests());

// mock-module-exempt: the shared provider hop resolves every target through node:dns before it
// dials, so a real lookup would make these tests depend on the network. Nothing is dialled.
const realDns = await import('node:dns/promises');
mock.module('node:dns/promises', () => ({
	...realDns,
	default: realDns,
	lookup: async () => [{ address: '17.253.144.10', family: 4 }],
}));

function plugin(fetch: FetchLike) {
	return createProviderPlugin({ fetch: createPinAwareFetch(fetch) });
}

const SONG_URL = 'https://music.apple.com/us/album/better-together/1440857781?i=1440857786';

function lookupRequest(url = SONG_URL) {
	return createMockRequest({
		input: createMockAtomInput({
			hints: { url },
			jsonLd: { '@context': 'https://schema.org', '@type': 'MusicRecording', url },
		}),
	});
}

function identifierRequest(identifiers: Record<string, string>) {
	return createMockRequest({
		input: createMockAtomInput({
			hints: { identifiers },
			jsonLd: { '@context': 'https://schema.org', '@type': 'MusicRecording' },
		}),
	});
}

const songSearch = () =>
	identifierRequest({ itunesSongSearch: 'Better Together|Jack Johnson|207679' });
const podcastSearch = () =>
	identifierRequest({ itunesPodcastSearch: 'The Daily|The New York Times' });

// Live-shape iTunes results (see the backlog note for the recorded responses).
const SONG = {
	wrapperType: 'track',
	kind: 'song',
	trackId: 1440857786,
	trackName: 'Better Together',
	artistName: 'Jack Johnson',
	collectionName: 'In Between Dreams',
	trackViewUrl: SONG_URL,
	previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/preview.m4a',
	trackTimeMillis: 207679,
};
const PODCAST = {
	wrapperType: 'track',
	kind: 'podcast',
	collectionId: 1200361736,
	collectionName: 'The Daily',
	artistName: 'The New York Times',
	feedUrl: 'https://feeds.simplecast.com/54nAGcIl',
};
const itunes = (results: unknown[]) => Response.json({ resultCount: results.length, results });

describe('apple-music observer: outcomes per operation', () => {
	test('lookup with a result is one lookup hit with a duration', async () => {
		await plugin(async () => itunes([SONG])).enrich(lookupRequest(), createMockPluginContext());
		expect(tuples()).toEqual([tuple('lookup', 'hit')]);
		expect(typeof requests()[0]?.durationMs).toBe('number');
	});

	test('lookup with resultCount 0 (HTTP 200) is a miss', async () => {
		const artifacts = await plugin(async () => itunes([])).enrich(
			lookupRequest(),
			createMockPluginContext()
		);
		expect(artifacts).toEqual([]);
		expect(tuples()).toEqual([tuple('lookup', 'miss')]);
	});

	test('a podcast lookup is a lookup', async () => {
		await plugin(async () => itunes([PODCAST])).enrich(
			lookupRequest('https://podcasts.apple.com/us/podcast/the-daily/id1200361736'),
			createMockPluginContext()
		);
		expect(tuples()).toEqual([tuple('lookup', 'hit')]);
	});

	test('song search that passes the gate is a search hit', async () => {
		await plugin(async () => itunes([SONG])).enrich(songSearch(), createMockPluginContext());
		expect(tuples()).toEqual([tuple('search', 'hit')]);
	});

	test('song search whose candidates all fail the gate is a miss, not a hit', async () => {
		const wrongArtist = { ...SONG, artistName: 'Someone Else' };
		const noPreview = { ...SONG, previewUrl: undefined };
		const artifacts = await plugin(async () => itunes([wrongArtist, noPreview])).enrich(
			songSearch(),
			createMockPluginContext()
		);
		expect(artifacts).toEqual([]);
		expect(tuples()).toEqual([tuple('search', 'miss')]);
	});

	test('podcast search is podcast_search: hit when the gate passes, miss otherwise', async () => {
		await plugin(async () => itunes([PODCAST])).enrich(podcastSearch(), createMockPluginContext());
		await plugin(async () => itunes([{ ...PODCAST, collectionName: 'Another Show' }])).enrich(
			podcastSearch(),
			createMockPluginContext()
		);
		expect(tuples()).toEqual([tuple('podcast_search', 'hit'), tuple('podcast_search', 'miss')]);
	});

	test('an ISRC identifier (what the removed augmentation chain used to send) is unsupported: no request, no event', async () => {
		let fetched = 0;
		const appleMusic = plugin(async () => {
			fetched += 1;
			return itunes([SONG]);
		});
		const isrcRequest = identifierRequest({ isrc: 'USUM71703861' });
		expect(appleMusic.supports(isrcRequest)).toBe(false);
		expect(await appleMusic.enrich(isrcRequest, createMockPluginContext())).toEqual([]);
		expect(fetched).toBe(0);
		expect(tuples()).toEqual([]);
	});
});

describe('apple-music observer: error reasons', () => {
	const failing = async (fetch: FetchLike, request = lookupRequest()) => {
		await plugin(fetch)
			.enrich(request, createMockPluginContext())
			.catch(() => undefined);
	};

	test('429 is rate_limited, 503 is upstream_5xx, 403 and 400 (bad storefront) are http_4xx', async () => {
		await failing(async () => new Response('', { status: 429 }));
		await failing(async () => new Response('', { status: 503 }));
		await failing(async () => new Response('', { status: 403 }));
		await failing(async () => new Response('', { status: 400 }));
		expect(tuples()).toEqual([
			tuple('lookup', 'error', 'rate_limited'),
			tuple('lookup', 'error', 'upstream_5xx'),
			tuple('lookup', 'error', 'http_4xx'),
			tuple('lookup', 'error', 'http_4xx'),
		]);
	});

	test('404 is NOT a miss: iTunes answers a miss with 200, so a 404 is an http_4xx', async () => {
		await failing(async () => new Response('', { status: 404 }));
		expect(tuples()).toEqual([tuple('lookup', 'error', 'http_4xx')]);
	});

	test('the reason follows the operation', async () => {
		await failing(async () => new Response('', { status: 429 }), songSearch());
		await failing(async () => new Response('', { status: 503 }), podcastSearch());
		expect(tuples()).toEqual([
			tuple('search', 'error', 'rate_limited'),
			tuple('podcast_search', 'error', 'upstream_5xx'),
		]);
	});

	test('a body that is not the iTunes shape, or not JSON, is invalid_response', async () => {
		await failing(async () => Response.json({ resultCount: 'many', results: 'no' }));
		await failing(async () => new Response('<html>', { status: 200 }));
		expect(tuples()).toEqual([
			tuple('lookup', 'error', 'invalid_response'),
			tuple('lookup', 'error', 'invalid_response'),
		]);
	});

	test('a malformed result that fails artifact validation is invalid_response, not a miss', async () => {
		await failing(async () =>
			itunes([
				{ wrapperType: 'track', kind: 'song', trackName: 'x', artistName: 'y', releaseDate: 5 },
			])
		);
		expect(tuples()).toEqual([tuple('lookup', 'error', 'invalid_response')]);
	});

	test('a thrown TypeError is network and another thrown error is other', async () => {
		await failing(async () => {
			throw new TypeError('connect ECONNREFUSED');
		});
		await failing(async () => {
			throw new RangeError('programming bug');
		});
		expect(tuples()).toEqual([
			tuple('lookup', 'error', 'network'),
			tuple('lookup', 'error', 'other'),
		]);
	});

	test('a timeout error inside the request is timeout', async () => {
		await failing(async () => {
			throw new DOMException('timed out', 'TimeoutError');
		});
		expect(tuples()).toEqual([tuple('lookup', 'error', 'timeout')]);
	});

	test('a redirect to an embargoed host is blocked and a redirect loop is invalid_response', async () => {
		await failing(
			async () =>
				new Response('', { status: 302, headers: { location: 'https://www.imdb.com/title/tt0' } })
		);
		await failing(
			async () =>
				new Response('', { status: 302, headers: { location: 'https://itunes.apple.com/loop' } })
		);
		expect(tuples()).toEqual([
			tuple('lookup', 'error', 'blocked'),
			tuple('lookup', 'error', 'invalid_response'),
		]);
	});

	test('the result is unchanged: errors still propagate to the engine', async () => {
		await expect(
			plugin(async () => new Response('', { status: 503 })).enrich(
				lookupRequest(),
				createMockPluginContext()
			)
		).rejects.toThrow();
	});
});

describe('apple-music observer: cancellation and deadline', () => {
	const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

	test('an already-aborted signal records nothing', async () => {
		const controller = new AbortController();
		controller.abort();
		await plugin(async () => itunes([SONG]))
			.enrich(lookupRequest(), createMockPluginContext({ signal: controller.signal }))
			.catch(() => undefined);
		expect(tuples()).toEqual([]);
	});

	test('the engine timeout of a hung call is exactly one error/timeout', async () => {
		const engine = createEnrichmentEngine({
			plugins: [plugin(() => new Promise<Response>(() => {}))],
		});
		const result = await engine.enrich({ ...lookupRequest(), timeoutMs: 40 });
		expect(result.errors.map((error) => error.code)).toEqual(['timeout']);
		await sleep(20);
		expect(tuples()).toEqual([tuple('lookup', 'error', 'timeout')]);
	});

	test('a caller cancelling before the deadline records nothing', async () => {
		const external = new AbortController();
		const engine = createEnrichmentEngine({
			plugins: [plugin(() => new Promise<Response>(() => {}))],
		});
		const pending = engine
			.enrich({ ...lookupRequest(), timeoutMs: 5000 }, { signal: external.signal })
			.catch((error: unknown) => error);
		await sleep(30);
		external.abort(new Error('user left'));
		await pending;
		await sleep(20);
		expect(tuples()).toEqual([]);
	});

	test('a completed request is recorded exactly once even if the signal aborts later', async () => {
		const controller = new AbortController();
		await plugin(async () => itunes([SONG])).enrich(
			lookupRequest(),
			createMockPluginContext({ signal: controller.signal })
		);
		controller.abort();
		expect(tuples()).toEqual([tuple('lookup', 'hit')]);
	});
});

describe('apple-music observer: engine artifact-cache hits (real engine, memory cache)', () => {
	const cacheTuples = () => tuples().filter((entry) => entry.source === 'cache');

	async function runTwice(request: ReturnType<typeof lookupRequest>, results: unknown[]) {
		let fetches = 0;
		const engine = createEnrichmentEngine({
			cache: createMemoryCacheAdapter(),
			plugins: [
				plugin(async () => {
					fetches += 1;
					return itunes(results);
				}),
			],
		});
		await engine.enrich({ ...request, plugins: ['apple-music'] });
		const afterLive = cacheTuples().length;
		const second = await engine.enrich({ ...request, plugins: ['apple-music'] });
		return { fetches, afterLive, second };
	}

	test.each([
		['lookup', lookupRequest, [SONG], 'hit'],
		['search', songSearch, [SONG], 'hit'],
		['podcast_search', podcastSearch, [PODCAST], 'hit'],
		['lookup', lookupRequest, [], 'miss'],
		['search', songSearch, [], 'miss'],
		['podcast_search', podcastSearch, [], 'miss'],
	] as const)('a cached %s run is one %s cache event and no extra fetch', async (operation, make, results, outcome) => {
		const { fetches, afterLive, second } = await runTwice(make(), [...results]);
		expect(fetches).toBe(1);
		expect(second.timings.cacheHits).toBe(1);
		expect(afterLive).toBe(0);
		expect(cacheTuples()).toEqual([{ operation, outcome, reason: 'none', source: 'cache' }]);
	});

	test('a request that is no apple-music target is not a cache event', async () => {
		const request = createMockRequest({ input: createMockAtomInput({}) });
		const engine = createEnrichmentEngine({
			cache: createMemoryCacheAdapter(),
			plugins: [plugin(async () => itunes([SONG]))],
		});
		await engine.enrich({ ...request, plugins: ['apple-music'] });
		await engine.enrich({ ...request, plugins: ['apple-music'] });
		expect(requests()).toEqual([]);
	});
});
