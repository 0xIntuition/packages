import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';
import { readFile } from 'node:fs/promises';
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
import { createTmdbPlugin } from './index';

let events: ProviderEvent[];
const requests = () =>
	events.filter((event): event is ProviderRequestEvent => event.type === 'provider_request');
const tuples = () =>
	requests().map(({ provider, operation, outcome, reason, source }) => ({
		provider,
		operation,
		outcome,
		reason,
		source,
	}));
const live = (
	outcome: ProviderRequestEvent['outcome'],
	reason: ProviderRequestEvent['reason'] = 'none'
) => ({
	provider: 'tmdb' as const,
	operation: 'details' as const,
	outcome,
	reason,
	source: 'live' as const,
});

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
	lookup: async () => [{ address: '93.184.216.34', family: 4 }],
}));

// An obviously fake key: nothing here ever reaches the network.
const FAKE_KEY = 'fake-tmdb-key-for-tests-only';
const fixture = JSON.parse(
	await readFile(new URL('./__fixtures__/movie.json', import.meta.url), 'utf8')
) as Record<string, unknown>;

function plugin(fetch: FetchLike, apiKey: string = FAKE_KEY) {
	return createTmdbPlugin({ apiKey, fetch: createPinAwareFetch(fetch) });
}

function movieRequest(id = 550) {
	return createMockRequest({
		input: createMockAtomInput({
			hints: { identifiers: { tmdb: `movie:${id}` } },
			jsonLd: { '@context': 'https://schema.org/', '@type': 'Movie' },
		}),
	});
}

const ok = () => Response.json(fixture);
const failing = async (fetch: FetchLike) => {
	await plugin(fetch)
		.enrich(movieRequest(), createMockPluginContext())
		.catch(() => undefined);
};

describe('tmdb observer: details outcomes', () => {
	test('a successful lookup is one details hit with a duration', async () => {
		const artifacts = await plugin(async () => ok()).enrich(
			movieRequest(),
			createMockPluginContext()
		);
		expect(artifacts).toHaveLength(1);
		expect(tuples()).toEqual([live('hit')]);
		expect(typeof requests()[0]?.durationMs).toBe('number');
	});

	test('404 is a miss, and the plugin returns no artifact instead of failing the run', async () => {
		const artifacts = await plugin(async () => new Response('{}', { status: 404 })).enrich(
			movieRequest(),
			createMockPluginContext()
		);
		expect(artifacts).toEqual([]);
		expect(tuples()).toEqual([live('miss')]);
	});

	test('401 is auth_failed and still propagates', async () => {
		await expect(
			plugin(async () => new Response('{}', { status: 401 })).enrich(
				movieRequest(),
				createMockPluginContext()
			)
		).rejects.toThrow();
		expect(tuples()).toEqual([live('error', 'auth_failed')]);
	});

	test('429 is rate_limited, 503 upstream_5xx, 403 http_4xx', async () => {
		await failing(async () => new Response('{}', { status: 429 }));
		await failing(async () => new Response('{}', { status: 503 }));
		await failing(async () => new Response('{}', { status: 403 }));
		expect(tuples()).toEqual([
			live('error', 'rate_limited'),
			live('error', 'upstream_5xx'),
			live('error', 'http_4xx'),
		]);
	});

	test('a payload whose id is not the requested one is invalid_response, not internal_error', async () => {
		await expect(
			plugin(async () => Response.json({ ...fixture, id: 551 })).enrich(
				movieRequest(),
				createMockPluginContext()
			)
		).rejects.toThrow('mismatched payload id');
		expect(tuples()).toEqual([live('error', 'invalid_response')]);
	});

	test('a body that is not JSON or not the TMDB shape is invalid_response', async () => {
		await failing(async () => new Response('<html>', { status: 200 }));
		await failing(async () => Response.json({ id: 'not-a-number' }));
		expect(tuples()).toEqual([
			live('error', 'invalid_response'),
			live('error', 'invalid_response'),
		]);
	});

	test('transport faults: TypeError is network, TimeoutError is timeout, anything else other', async () => {
		await failing(async () => {
			throw new TypeError('connect ECONNREFUSED');
		});
		await failing(async () => {
			throw new DOMException('timed out', 'TimeoutError');
		});
		await failing(async () => {
			throw new RangeError('bug');
		});
		expect(tuples()).toEqual([
			live('error', 'network'),
			live('error', 'timeout'),
			live('error', 'other'),
		]);
	});

	test('a redirect is refused (redirect: error) and is invalid_response', async () => {
		await failing(
			async () => new Response('', { status: 302, headers: { location: 'https://example.com/x' } })
		);
		expect(tuples()).toEqual([live('error', 'invalid_response')]);
	});
});

describe('tmdb observer: dormant without a key', () => {
	// A blank key is "no key" (an omitted one falls back to the process env, which the
	// env-injection guard keeps this file from touching).
	test.each(['', '   '])('key %p: no fetch, no event, not supported', async (key) => {
		let fetched = 0;
		const dormant = plugin(async () => {
			fetched += 1;
			return ok();
		}, key);
		const request = movieRequest();
		expect(dormant.supports(request)).toBe(false);
		expect(await dormant.enrich(request, createMockPluginContext())).toEqual([]);
		expect(fetched).toBe(0);
		expect(tuples()).toEqual([]);
	});

	test('a blank key also has no cache operations, so a cached run records nothing', async () => {
		const engine = createEnrichmentEngine({
			cache: createMemoryCacheAdapter(),
			plugins: [plugin(async () => ok(), '')],
		});
		const request = { ...movieRequest(), plugins: ['tmdb'] };
		await engine.enrich(request);
		await engine.enrich(request);
		expect(requests()).toEqual([]);
	});
});

describe('tmdb observer: cancellation and deadline', () => {
	const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

	test('an already-aborted signal records nothing', async () => {
		const controller = new AbortController();
		controller.abort();
		await plugin(async () => ok())
			.enrich(movieRequest(), createMockPluginContext({ signal: controller.signal }))
			.catch(() => undefined);
		expect(tuples()).toEqual([]);
	});

	test('the engine deadline of a hung call is exactly one error/timeout', async () => {
		const engine = createEnrichmentEngine({
			plugins: [plugin(() => new Promise<Response>(() => {}))],
		});
		const result = await engine.enrich({ ...movieRequest(), timeoutMs: 40 });
		expect(result.errors.map((error) => error.code)).toEqual(['timeout']);
		await sleep(20);
		expect(tuples()).toEqual([live('error', 'timeout')]);
	});

	test('a caller cancelling before the deadline records nothing', async () => {
		const external = new AbortController();
		const engine = createEnrichmentEngine({
			plugins: [plugin(() => new Promise<Response>(() => {}))],
		});
		const pending = engine
			.enrich({ ...movieRequest(), timeoutMs: 5000 }, { signal: external.signal })
			.catch((error: unknown) => error);
		await sleep(30);
		external.abort(new Error('user left'));
		await pending;
		await sleep(20);
		expect(tuples()).toEqual([]);
	});
});

describe('tmdb observer: engine artifact-cache hits (real engine, memory cache)', () => {
	const cacheTuples = () => tuples().filter((entry) => entry.source === 'cache');

	async function runTwice(response: () => Response) {
		let fetches = 0;
		const engine = createEnrichmentEngine({
			cache: createMemoryCacheAdapter(),
			plugins: [
				plugin(async () => {
					fetches += 1;
					return response();
				}),
			],
		});
		const request = { ...movieRequest(), plugins: ['tmdb'] };
		await engine.enrich(request);
		const afterLive = cacheTuples().length;
		const second = await engine.enrich(request);
		return { fetches, afterLive, second };
	}

	test('a cached run is one details cache hit and no second fetch', async () => {
		const { fetches, afterLive, second } = await runTwice(ok);
		expect(fetches).toBe(1);
		expect(second.timings.cacheHits).toBe(1);
		expect(afterLive).toBe(0);
		expect(cacheTuples()).toEqual([
			{ provider: 'tmdb', operation: 'details', outcome: 'hit', reason: 'none', source: 'cache' },
		]);
	});

	test('a cached 404 (empty result) is one details cache miss', async () => {
		const { fetches, second } = await runTwice(() => new Response('{}', { status: 404 }));
		expect(fetches).toBe(1);
		expect(second.timings.cacheHits).toBe(1);
		expect(cacheTuples()).toEqual([
			{ provider: 'tmdb', operation: 'details', outcome: 'miss', reason: 'none', source: 'cache' },
		]);
	});

	test('a request that is no TMDB target is not a cache event', async () => {
		const request = createMockRequest({ input: createMockAtomInput({}) });
		const engine = createEnrichmentEngine({
			cache: createMemoryCacheAdapter(),
			plugins: [plugin(async () => ok())],
		});
		await engine.enrich({ ...request, plugins: ['tmdb'] });
		await engine.enrich({ ...request, plugins: ['tmdb'] });
		expect(requests()).toEqual([]);
	});
});
