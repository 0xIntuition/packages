import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createPinAwareFetch } from '@0xintuition/atom-enrichment/providers';
import { useStubbedPublicDns } from '@0xintuition/atom-enrichment/testing';
import {
	addProviderObserver,
	type ProviderEvent,
	type ProviderReason,
	type ProviderRequestEvent,
	resetProviderObserversForTests,
} from '@0xintuition/pipeline-runtime/provider-observer';

import { createClassificationEngine } from '../src/engine';
import { createV0TypeProfilesPlugin, createYouTubeOEmbedAdapter } from '../src/plugins/index';
import { PLATFORM_STAGE_MISS, type PlatformStageInput } from '../src/plugins/shared/platform';
import { createYouTubePlugin } from '../src/plugins/youtube';

// The shared provider hop resolves every target before it dials; no network is used.
useStubbedPublicDns();

const VIDEO_URL = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
const okBody = {
	title: 'Never Gonna Give You Up',
	author_name: 'Rick Astley',
	thumbnail_url: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
};

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
const classifyOembed = (
	outcome: ProviderRequestEvent['outcome'],
	reason: ProviderReason = 'none'
) => ({
	provider: 'youtube',
	operation: 'classify_oembed',
	outcome,
	reason,
	source: 'live',
});

beforeEach(() => {
	events = [];
	resetProviderObserversForTests();
	addProviderObserver((event) => {
		events.push(event);
	});
});
afterEach(() => resetProviderObserversForTests());

type Handler = (init?: RequestInit) => Response | Promise<Response>;

function classify(handler: Handler) {
	const urls: string[] = [];
	const fetch = createPinAwareFetch(async (input: string, init?: RequestInit) => {
		urls.push(input);
		return await handler(init);
	});
	const engine = createClassificationEngine({
		onClassifierError: () => undefined,
		runtime: 'server',
		plugins: [
			createV0TypeProfilesPlugin(),
			createYouTubePlugin({ adapters: { oEmbed: createYouTubeOEmbedAdapter({ fetch }) } }),
		],
	});
	return {
		urls,
		run: () => engine.classify({ input: VIDEO_URL, mode: 'progressive' }),
	};
}

describe('YouTube classification oEmbed: the real stage runner', () => {
	it('a found video resolves via oembed and records one classify_oembed hit', async () => {
		const { run, urls } = classify(() => Response.json(okBody));
		const result = await run();
		expect(result.resolved?.atoms[0]?.source).toBe('platform-v0:oembed');
		expect(result.resolved?.atoms[0]?.title).toBe(okBody.title);
		expect(urls).toHaveLength(1);
		expect(tuples()).toEqual([classifyOembed('hit')]);
		expect(typeof requests()[0]?.durationMs).toBe('number');
	});

	it('records classification-side series only: never the enrichment oembed|youtube', async () => {
		await classify(() => Response.json(okBody)).run();
		expect(tuples()).toEqual([classifyOembed('hit')]);
		expect(requests().filter((event) => event.provider === 'oembed')).toEqual([]);
	});

	it('an oEmbed answer without a title is a miss and the paste falls back to generic', async () => {
		const result = await classify(() => Response.json({ author_name: 'Nobody' })).run();
		expect(result.resolved?.atoms[0]?.source).toBe('platform-v0:generic');
		expect(tuples()).toEqual([classifyOembed('miss')]);
	});

	it.each([404, 401, 403, 410])('HTTP %d is a miss', async (status) => {
		const result = await classify(() => new Response('Not Found', { status })).run();
		expect(result.status).toBe('complete');
		expect(result.resolved?.atoms[0]?.source).toBe('platform-v0:generic');
		expect(tuples()).toEqual([classifyOembed('miss')]);
	});

	it.each([
		404, 401, 403, 410,
	])('HTTP %d is silent in the stage diagnostics: the metric and the stage agree on "no record"', async (status) => {
		const result = await classify(() => new Response('', { status })).run();
		expect(result.resolverErrors?.map((error) => error.message) ?? []).toEqual([]);
		expect(tuples()).toEqual([classifyOembed('miss')]);
	});

	it.each([
		[429, 'rate_limited'],
		[500, 'upstream_5xx'],
		[503, 'upstream_5xx'],
		[400, 'http_4xx'],
	] as const)('HTTP %d is an error with reason %s and a status diagnostic', async (status, reason) => {
		const result = await classify(() => new Response('{}', { status })).run();
		expect(result.status).toBe('complete');
		expect(result.resolved?.atoms[0]?.source).toBe('platform-v0:generic');
		expect(tuples()).toEqual([classifyOembed('error', reason)]);
		expect(result.resolverErrors?.map((error) => error.message)).toEqual([
			`oembed:non_ok_status: HTTP ${status}`,
		]);
	});

	it('a body that is not JSON is invalid_response with a parse_failure diagnostic', async () => {
		const result = await classify(() => new Response('<html>')).run();
		expect(tuples()).toEqual([classifyOembed('error', 'invalid_response')]);
		expect(result.resolverErrors?.map((error) => error.message)).toEqual([
			'oembed:parse_failure: YouTube response was invalid',
		]);
	});

	it('a JSON body that is not an object is invalid_response (it used to be a silent miss)', async () => {
		const result = await classify(() => Response.json([1, 2])).run();
		expect(tuples()).toEqual([classifyOembed('error', 'invalid_response')]);
		expect(result.resolverErrors?.map((error) => error.message)).toEqual([
			'oembed:parse_failure: YouTube response was invalid',
		]);
		expect(result.resolved?.atoms[0]?.source).toBe('platform-v0:generic');
	});

	it('a body over the cap is refused, not buffered', async () => {
		const huge = JSON.stringify({ title: 'x'.repeat(200 * 1024) });
		const result = await classify(() => new Response(huge)).run();
		expect(tuples()).toEqual([classifyOembed('error', 'invalid_response')]);
		expect(result.resolved?.atoms[0]?.source).toBe('platform-v0:generic');
		expect(result.resolverErrors?.map((error) => error.message)).toEqual([
			'oembed:parse_failure: YouTube response was invalid',
		]);
	});

	it('a redirect is refused by the guarded fetch and diagnosed without the target', async () => {
		const result = await classify(
			() => new Response(null, { status: 302, headers: { location: 'https://evil.example/' } })
		).run();
		expect(tuples()).toEqual([classifyOembed('error', 'invalid_response')]);
		expect(JSON.stringify(result.resolverErrors)).not.toContain('evil.example');
	});

	it('a transport failure is network with an http_error diagnostic', async () => {
		const result = await classify(() => {
			throw new TypeError('fetch failed');
		}).run();
		expect(tuples()).toEqual([classifyOembed('error', 'network')]);
		expect(result.resolverErrors?.map((error) => error.message)).toEqual([
			'oembed:http_error: YouTube request failed',
		]);
	});
});

describe('YouTube classification oEmbed: stage signal and deadline', () => {
	function stageInput(extra: Partial<PlatformStageInput>): PlatformStageInput {
		return {
			runtime: 'server',
			now: '2026-10-22T00:00:00.000Z',
			domain: 'youtube',
			classification: {
				type: 'url',
				subtype: 'video',
				domain: 'youtube',
				meta: { videoId: 'dQw4w9WgXcQ' },
			} as unknown as PlatformStageInput['classification'],
			requestInput: VIDEO_URL,
			canonicalUrl: VIDEO_URL,
			stageContext: new Map(),
			...extra,
		};
	}

	/** A fetch that never answers until its own signal aborts, like a hung upstream. */
	function hangingFetch() {
		const seen: { signal?: AbortSignal | null } = {};
		const fetch = createPinAwareFetch(
			(_input: string, init?: RequestInit) =>
				new Promise<Response>((_resolve, reject) => {
					seen.signal = init?.signal;
					init?.signal?.addEventListener('abort', () =>
						reject(new DOMException('aborted', 'AbortError'))
					);
				})
		);
		return { fetch, seen };
	}

	it('the stage signal reaches the request: aborting it ends a hung lookup', async () => {
		const { fetch, seen } = hangingFetch();
		const adapter = createYouTubeOEmbedAdapter({ fetch });
		const controller = new AbortController();
		const pending = Promise.resolve(adapter(stageInput({ signal: controller.signal }))).catch(
			(error: unknown) => error as Error & { reason?: string }
		);
		await new Promise((resolve) => setTimeout(resolve, 20));
		expect(seen.signal).toBeDefined();
		controller.abort();
		const error = await pending;
		// Not a timeout: the engine deadline never passed.
		expect(error).toMatchObject({
			reason: 'adapter_error',
			message: 'YouTube request was cancelled',
		});
		// A caller cancel is nothing the provider did.
		expect(tuples()).toEqual([]);
	});

	it('the engine deadline abort is a provider timeout', async () => {
		const { fetch } = hangingFetch();
		const adapter = createYouTubeOEmbedAdapter({ fetch });
		const controller = new AbortController();
		const deadlineAtMs = Date.now() + 10;
		setTimeout(() => controller.abort(), 30);
		const error = await Promise.resolve(
			adapter(stageInput({ signal: controller.signal, deadlineAtMs }))
		).catch((caught: unknown) => caught as Error & { reason?: string });
		expect(error).toMatchObject({ reason: 'timeout', message: 'YouTube request timed out' });
		expect(tuples()).toEqual([classifyOembed('error', 'timeout')]);
	});

	it('a non-YouTube or non-video input is a miss and moves nothing', async () => {
		const adapter = createYouTubeOEmbedAdapter({
			fetch: createPinAwareFetch(async () => Response.json(okBody)),
		});
		expect(await adapter(stageInput({ domain: 'spotify' }))).toBe(PLATFORM_STAGE_MISS);
		expect(tuples()).toEqual([]);
	});
});
