import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import {
	addProviderObserver,
	type ProviderEvent,
	type ProviderRequestEvent,
	resetProviderObserversForTests,
} from '@0xintuition/pipeline-runtime/provider-observer';

import { createMemoryCacheAdapter } from '../../../cache';
import { createEnrichmentEngine } from '../../../engine';
import {
	createMockAtomInput,
	createMockPluginContext,
	createMockRequest,
	useStubbedPublicDns,
} from '../../../testing';
import { createPinAwareFetch } from '../__shared__/http';
import videoFixture from './__fixtures__/video.json';
import { createYouTubePlugin } from './index';

useStubbedPublicDns();

// An obviously fake key: no test here talks to Google.
const FAKE_KEY = 'FAKE-YOUTUBE-KEY-NOT-REAL';
const VIDEO_ID = 'abc123xyz89';

let events: ProviderEvent[];
const requests = () =>
	events.filter((event): event is ProviderRequestEvent => event.type === 'provider_request');
type Tuple = Record<'provider' | 'operation' | 'outcome' | 'reason' | 'source', string>;
const tuples = (): Tuple[] =>
	requests().map(({ provider, operation, outcome, reason, source }) => ({
		provider,
		operation,
		outcome,
		reason,
		source,
	}));
const video = (
	outcome: ProviderRequestEvent['outcome'],
	reason: ProviderRequestEvent['reason'] = 'none',
	source: ProviderRequestEvent['source'] = 'live'
) => ({ provider: 'youtube', operation: 'video', outcome, reason, source });

beforeEach(() => {
	events = [];
	resetProviderObserversForTests();
	addProviderObserver((event) => {
		events.push(event);
	});
});
afterEach(() => resetProviderObserversForTests());

function recordingFetch(respond: () => Response | Promise<Response>) {
	const urls: string[] = [];
	const fetch = createPinAwareFetch(async (input: string) => {
		urls.push(input);
		return await respond();
	});
	return { fetch, urls };
}

const request = () =>
	createMockRequest({
		input: createMockAtomInput({
			hints: { url: `https://www.youtube.com/watch?v=${VIDEO_ID}` },
		}),
	});

const ok = () => Response.json(videoFixture);

describe('YouTube video enrichment observer: keyed', () => {
	test('a found video is one video hit and sends the key', async () => {
		const { fetch, urls } = recordingFetch(ok);
		const plugin = createYouTubePlugin({ apiKey: FAKE_KEY, fetch });
		const artifacts = await plugin.enrich(request(), createMockPluginContext());
		expect(artifacts[0]?.data).toMatchObject({ videoId: VIDEO_ID, title: 'Acme Demo' });
		expect(tuples()).toEqual([video('hit')]);
		expect(typeof requests()[0]?.durationMs).toBe('number');
		expect(urls).toHaveLength(1);
		expect(new URL(urls[0] ?? '').searchParams.get('key')).toBe(FAKE_KEY);
	});

	test('empty items is a miss, not a silent hit', async () => {
		const { fetch } = recordingFetch(() => Response.json({ items: [] }));
		const plugin = createYouTubePlugin({ apiKey: FAKE_KEY, fetch });
		expect(await plugin.enrich(request(), createMockPluginContext())).toEqual([]);
		expect(tuples()).toEqual([video('miss')]);
	});

	test.each([
		[403, 'auth_failed'],
		[429, 'rate_limited'],
		[404, 'http_4xx'],
		[500, 'upstream_5xx'],
	] as const)('HTTP %d is an error with reason %s', async (status, reason) => {
		const { fetch } = recordingFetch(() => new Response('{}', { status }));
		const plugin = createYouTubePlugin({ apiKey: FAKE_KEY, fetch });
		await expect(plugin.enrich(request(), createMockPluginContext())).rejects.toThrow();
		expect(tuples()).toEqual([video('error', reason)]);
	});

	// Observed live: an invalid key is a 400 whose Google envelope carries reason API_KEY_INVALID.
	// Only that reason is the key; any other 400 is a malformed request and must not page the key.
	const googleBody = (reason: string) => ({
		error: { code: 400, status: 'INVALID_ARGUMENT', details: [{ reason }] },
	});

	test.each([
		['API_KEY_INVALID', 'auth_failed'],
		['API_KEY_EXPIRED', 'auth_failed'],
		['INVALID_ARGUMENT', 'http_4xx'],
		['SOMETHING_ELSE', 'http_4xx'],
	] as const)('HTTP 400 with Google reason %s is %s', async (reason, expected) => {
		const { fetch } = recordingFetch(() => Response.json(googleBody(reason), { status: 400 }));
		const plugin = createYouTubePlugin({ apiKey: FAKE_KEY, fetch });
		await expect(plugin.enrich(request(), createMockPluginContext())).rejects.toThrow();
		expect(tuples()).toEqual([video('error', expected)]);
	});

	test('HTTP 400 without a readable Google reason is http_4xx, not auth_failed', async () => {
		const { fetch } = recordingFetch(() => new Response('not json', { status: 400 }));
		const plugin = createYouTubePlugin({ apiKey: FAKE_KEY, fetch });
		await expect(plugin.enrich(request(), createMockPluginContext())).rejects.toThrow();
		expect(tuples()).toEqual([video('error', 'http_4xx')]);
	});

	test('the request carries exactly part, id and key (widen it and re-check the 400 mapping)', async () => {
		const { fetch, urls } = recordingFetch(ok);
		const plugin = createYouTubePlugin({ apiKey: FAKE_KEY, fetch });
		await plugin.enrich(request(), createMockPluginContext());
		const url = new URL(urls[0] ?? '');
		expect([...url.searchParams.keys()].sort()).toEqual(['id', 'key', 'part']);
		expect(url.searchParams.get('id')).toBe(VIDEO_ID);
	});

	test('a payload that fails the schema is invalid_response', async () => {
		const { fetch } = recordingFetch(() => Response.json({ items: 'nope' }));
		const plugin = createYouTubePlugin({ apiKey: FAKE_KEY, fetch });
		await expect(plugin.enrich(request(), createMockPluginContext())).rejects.toThrow();
		expect(tuples()).toEqual([video('error', 'invalid_response')]);
	});

	test('a redirect is refused so the key in the URL never follows it', async () => {
		const { fetch, urls } = recordingFetch(
			() => new Response(null, { status: 302, headers: { location: 'https://evil.example/x' } })
		);
		const plugin = createYouTubePlugin({ apiKey: FAKE_KEY, fetch });
		await expect(plugin.enrich(request(), createMockPluginContext())).rejects.toThrow();
		expect(urls).toHaveLength(1);
		expect(urls.some((url) => url.includes('evil.example'))).toBe(false);
		expect(tuples()).toEqual([video('error', 'invalid_response')]);
	});

	test('a transport failure is network', async () => {
		const fetch = createPinAwareFetch(async () => {
			throw new TypeError('fetch failed');
		});
		const plugin = createYouTubePlugin({ apiKey: FAKE_KEY, fetch });
		await expect(plugin.enrich(request(), createMockPluginContext())).rejects.toThrow();
		expect(tuples()).toEqual([video('error', 'network')]);
	});

	test('a caller cancel records nothing', async () => {
		const controller = new AbortController();
		const fetch = createPinAwareFetch(async () => {
			controller.abort();
			throw new DOMException('aborted', 'AbortError');
		});
		const plugin = createYouTubePlugin({ apiKey: FAKE_KEY, fetch });
		await expect(
			plugin.enrich(request(), createMockPluginContext({ signal: controller.signal }))
		).rejects.toThrow();
		expect(tuples()).toEqual([]);
	});
});

// The env source is injected (`env: {}`), so none of these depends on the machine's
// YOUTUBE_API_KEY or a `.env` file that Bun auto-loads.
describe('YouTube video enrichment observer: dormant without a key', () => {
	test.each([undefined, '', '   '])('key %p: supports() is false', (apiKey) => {
		const { fetch } = recordingFetch(ok);
		const plugin = createYouTubePlugin({
			...(apiKey === undefined ? {} : { apiKey }),
			env: {},
			fetch,
		});
		expect(plugin.supports(request())).toBe(false);
	});

	test('through the engine: no request and no series movement', async () => {
		const { fetch, urls } = recordingFetch(ok);
		const engine = createEnrichmentEngine({
			cache: createMemoryCacheAdapter(),
			plugins: [createYouTubePlugin({ env: {}, fetch })],
		});
		const result = await engine.enrich(request());
		expect(result.artifacts).toEqual([]);
		expect(urls).toEqual([]);
		expect(tuples()).toEqual([]);
	});

	test('enrich() called directly without a key still makes no request', async () => {
		const { fetch, urls } = recordingFetch(ok);
		const plugin = createYouTubePlugin({ env: {}, fetch });
		expect(await plugin.enrich(request(), createMockPluginContext())).toEqual([]);
		expect(urls).toEqual([]);
		expect(tuples()).toEqual([]);
	});

	test('a request that is not a YouTube video moves nothing even with a key', async () => {
		const { fetch, urls } = recordingFetch(ok);
		const plugin = createYouTubePlugin({ apiKey: FAKE_KEY, fetch });
		const other = createMockRequest({
			input: createMockAtomInput({ hints: { url: 'https://example.com/watch?v=abc123xyz89' } }),
		});
		expect(plugin.supports(other)).toBe(false);
		expect(urls).toEqual([]);
		expect(tuples()).toEqual([]);
	});
});

describe('YouTube video enrichment observer: the YOUTUBE_API_KEY fallback', () => {
	test('no apiKey option and a key in the env: keyed, supports() is true and the env key is sent', async () => {
		const { fetch, urls } = recordingFetch(ok);
		const plugin = createYouTubePlugin({ env: { YOUTUBE_API_KEY: ` ${FAKE_KEY} ` }, fetch });
		expect(plugin.supports(request())).toBe(true);
		await plugin.enrich(request(), createMockPluginContext());
		expect(new URL(urls[0] ?? '').searchParams.get('key')).toBe(FAKE_KEY);
		expect(tuples()).toEqual([video('hit')]);
	});

	test('a whitespace-only env key leaves the plugin dormant', async () => {
		const { fetch, urls } = recordingFetch(ok);
		const plugin = createYouTubePlugin({ env: { YOUTUBE_API_KEY: '   ' }, fetch });
		expect(plugin.supports(request())).toBe(false);
		expect(await plugin.enrich(request(), createMockPluginContext())).toEqual([]);
		expect(urls).toEqual([]);
		expect(tuples()).toEqual([]);
	});

	test('an explicit apiKey wins over the env', async () => {
		const { fetch, urls } = recordingFetch(ok);
		const plugin = createYouTubePlugin({
			apiKey: FAKE_KEY,
			env: { YOUTUBE_API_KEY: 'FAKE-OTHER-KEY' },
			fetch,
		});
		await plugin.enrich(request(), createMockPluginContext());
		expect(new URL(urls[0] ?? '').searchParams.get('key')).toBe(FAKE_KEY);
	});
});

describe('YouTube video enrichment observer: engine deadline', () => {
	test('a hung upstream past the engine deadline is a video timeout', async () => {
		const fetch = createPinAwareFetch(
			(_input: string, init?: RequestInit) =>
				new Promise<Response>((_resolve, reject) => {
					init?.signal?.addEventListener('abort', () =>
						reject(new DOMException('aborted', 'AbortError'))
					);
				})
		);
		const plugin = createYouTubePlugin({ apiKey: FAKE_KEY, fetch });
		const controller = new AbortController();
		const deadlineAtMs = Date.now() + 10;
		setTimeout(() => controller.abort(), 30);
		await expect(
			plugin.enrich(request(), createMockPluginContext({ signal: controller.signal, deadlineAtMs }))
		).rejects.toThrow();
		expect(tuples()).toEqual([video('error', 'timeout')]);
	});
});

describe('YouTube video enrichment observer: the engine artifact cache', () => {
	test('a cached found video is one source=cache video hit and dials nothing', async () => {
		const { fetch, urls } = recordingFetch(ok);
		const engine = createEnrichmentEngine({
			cache: createMemoryCacheAdapter(),
			plugins: [createYouTubePlugin({ apiKey: FAKE_KEY, fetch })],
		});
		await engine.enrich(request());
		const second = await engine.enrich(request());
		expect(second.timings.cacheHits).toBe(1);
		expect(urls).toHaveLength(1);
		expect(tuples()).toEqual([video('hit'), video('hit', 'none', 'cache')]);
	});

	test('a cached empty result is a source=cache video miss', async () => {
		const { fetch, urls } = recordingFetch(() => Response.json({ items: [] }));
		const engine = createEnrichmentEngine({
			cache: createMemoryCacheAdapter(),
			plugins: [createYouTubePlugin({ apiKey: FAKE_KEY, fetch })],
		});
		await engine.enrich(request());
		await engine.enrich(request());
		expect(urls).toHaveLength(1);
		expect(tuples()).toEqual([video('miss'), video('miss', 'none', 'cache')]);
	});
});
