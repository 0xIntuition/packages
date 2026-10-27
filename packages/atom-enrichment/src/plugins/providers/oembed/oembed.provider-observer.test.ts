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
import { createOEmbedPlugin } from './index';

useStubbedPublicDns();

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
const oembed = (
	operation: string,
	outcome: ProviderRequestEvent['outcome'],
	reason: ProviderRequestEvent['reason'] = 'none',
	source: ProviderRequestEvent['source'] = 'live'
) => ({ provider: 'oembed', operation, outcome, reason, source });

beforeEach(() => {
	events = [];
	resetProviderObserversForTests();
	addProviderObserver((event) => {
		events.push(event);
	});
});
afterEach(() => resetProviderObserversForTests());

const body = { type: 'video', title: 'Demo', provider_name: 'Provider' };

function recordingFetch(respond: (url: string) => Response | Promise<Response>) {
	const urls: string[] = [];
	const fetch = createPinAwareFetch(async (input: string) => {
		urls.push(input);
		return await respond(input);
	});
	return { fetch, urls };
}

const requestFor = (url: string) =>
	createMockRequest({ input: createMockAtomInput({ hints: { url } }) });

const URLS = {
	youtube: 'https://www.youtube.com/watch?v=abc123xyz89',
	vimeo: 'https://vimeo.com/22439234',
	twitter: 'https://twitter.com/jack/status/20',
} as const;

describe('oEmbed enrichment observer: fixed operations', () => {
	test.each(
		Object.entries(URLS)
	)('a %s URL is one oembed hit for that operation', async (id, url) => {
		const { fetch, urls } = recordingFetch(() => Response.json(body));
		const plugin = createOEmbedPlugin({ fetch });
		const artifacts = await plugin.enrich(requestFor(url), createMockPluginContext());
		expect(artifacts[0]?.meta.provider).toBe(id);
		expect(tuples()).toEqual([oembed(id, 'hit')]);
		expect(typeof requests()[0]?.durationMs).toBe('number');
		expect(urls).toHaveLength(1);
	});

	test('a twitter URL dials publish.x.com directly: no guaranteed 301 hop (observed live)', async () => {
		const { fetch, urls } = recordingFetch(() => Response.json(body));
		await createOEmbedPlugin({ fetch }).enrich(requestFor(URLS.twitter), createMockPluginContext());
		expect(urls).toHaveLength(1);
		expect(new URL(urls[0] ?? '').origin + new URL(urls[0] ?? '').pathname).toBe(
			'https://publish.x.com/oembed'
		);
		expect(tuples()).toEqual([oembed('twitter', 'hit')]);
	});

	test('the live Twitter body (height: null, observed with curl) is a hit with the dimension dropped', async () => {
		const live = {
			url: 'https://x.com/jack/status/20',
			author_name: 'jack',
			html: '<blockquote class="twitter-tweet"></blockquote>',
			width: 550,
			height: null,
			type: 'rich',
			provider_name: 'X',
		};
		const { fetch } = recordingFetch(() => Response.json(live));
		const artifacts = await createOEmbedPlugin({ fetch }).enrich(
			requestFor(URLS.twitter),
			createMockPluginContext()
		);
		expect(tuples()).toEqual([oembed('twitter', 'hit')]);
		expect(artifacts[0]?.data).toMatchObject({ width: 550, providerName: 'X' });
		expect(artifacts[0]?.data).not.toHaveProperty('height', null);
	});

	test('a redirect from the twitter endpoint is still followed and counted once', async () => {
		const { fetch, urls } = recordingFetch((url) =>
			new URL(url).hostname === 'publish.x.com'
				? new Response(null, {
						status: 301,
						headers: { location: 'https://publish.moved.example/oembed' },
					})
				: Response.json(body)
		);
		await createOEmbedPlugin({ fetch }).enrich(requestFor(URLS.twitter), createMockPluginContext());
		expect(urls).toHaveLength(2);
		expect(tuples()).toEqual([oembed('twitter', 'hit')]);
	});
});

describe('oEmbed enrichment observer: failures', () => {
	test.each([
		401, 403, 404, 410,
	])('HTTP %d (private, deleted or not embeddable) is a miss', async (status) => {
		const { fetch } = recordingFetch(() => new Response('Not Found', { status }));
		const plugin = createOEmbedPlugin({ fetch });
		await expect(
			plugin.enrich(requestFor(URLS.vimeo), createMockPluginContext())
		).rejects.toThrow();
		expect(tuples()).toEqual([oembed('vimeo', 'miss')]);
	});

	test.each([
		[400, 'http_4xx'],
		[429, 'rate_limited'],
		[500, 'upstream_5xx'],
		[503, 'upstream_5xx'],
	] as const)('HTTP %d is an error with reason %s', async (status, reason) => {
		const { fetch } = recordingFetch(() => new Response('x', { status }));
		await expect(
			createOEmbedPlugin({ fetch }).enrich(requestFor(URLS.youtube), createMockPluginContext())
		).rejects.toThrow();
		expect(tuples()).toEqual([oembed('youtube', 'error', reason)]);
	});

	test('a payload that fails the schema is invalid_response', async () => {
		const { fetch } = recordingFetch(() => Response.json({ title: 'no type' }));
		await expect(
			createOEmbedPlugin({ fetch }).enrich(requestFor(URLS.twitter), createMockPluginContext())
		).rejects.toThrow();
		expect(tuples()).toEqual([oembed('twitter', 'error', 'invalid_response')]);
	});

	test('a transport failure is network', async () => {
		const fetch = createPinAwareFetch(async () => {
			throw new TypeError('fetch failed');
		});
		await expect(
			createOEmbedPlugin({ fetch }).enrich(requestFor(URLS.youtube), createMockPluginContext())
		).rejects.toThrow();
		expect(tuples()).toEqual([oembed('youtube', 'error', 'network')]);
	});

	test('a caller cancel records nothing', async () => {
		const controller = new AbortController();
		const fetch = createPinAwareFetch(async () => {
			controller.abort();
			throw new DOMException('aborted', 'AbortError');
		});
		await expect(
			createOEmbedPlugin({ fetch }).enrich(
				requestFor(URLS.youtube),
				createMockPluginContext({ signal: controller.signal })
			)
		).rejects.toThrow();
		expect(tuples()).toEqual([]);
	});
});

describe('oEmbed enrichment observer: no dynamic label values', () => {
	const custom = {
		id: 'attacker-controlled-provider-id',
		matcher: /^https:\/\/media\.example\.test\//,
		oembedEndpoint: 'https://media.example.test/oembed',
	};

	test('an options.providers id outside the fixed set records nothing, live or cached', async () => {
		const { fetch, urls } = recordingFetch(() => Response.json(body));
		const plugin = createOEmbedPlugin({ fetch, providers: [custom] });
		const url = 'https://media.example.test/clip/1';
		const engine = createEnrichmentEngine({ cache: createMemoryCacheAdapter(), plugins: [plugin] });
		const first = await engine.enrich(requestFor(url));
		expect(first.artifacts).toHaveLength(1);
		expect(first.artifacts[0]?.meta.provider).toBe(custom.id);
		const second = await engine.enrich(requestFor(url));
		expect(second.timings.cacheHits).toBe(1);
		expect(urls).toHaveLength(1);
		expect(tuples()).toEqual([]);
	});

	test.each([
		'youtube',
		'vimeo',
		'twitter',
	])('a custom provider reusing the fixed id %s records nothing, live or cached', async (id) => {
		const { fetch, urls } = recordingFetch(() => Response.json(body));
		const plugin = createOEmbedPlugin({ fetch, providers: [{ ...custom, id }] });
		const url = 'https://media.example.test/clip/1';
		await plugin.enrich(requestFor(url), createMockPluginContext());
		expect(tuples()).toEqual([]);
		const engine = createEnrichmentEngine({ cache: createMemoryCacheAdapter(), plugins: [plugin] });
		await engine.enrich(requestFor(url));
		const second = await engine.enrich(requestFor(url));
		expect(second.timings.cacheHits).toBe(1);
		expect(urls).toHaveLength(2);
		expect(tuples()).toEqual([]);
	});

	test('a custom provider listed first does not capture a built-in URL: the built-in is labelled by what it is', async () => {
		const { fetch } = recordingFetch(() => Response.json(body));
		const plugin = createOEmbedPlugin({
			fetch,
			providers: [{ ...custom, id: 'vimeo', matcher: /^https:\/\/vimeo\.com\// }],
		});
		await plugin.enrich(requestFor(URLS.vimeo), createMockPluginContext());
		expect(tuples()).toEqual([]);
	});

	test('a caller list that includes the built-in entry (same endpoint) is still labelled', async () => {
		const { fetch } = recordingFetch(() => Response.json(body));
		const plugin = createOEmbedPlugin({
			fetch,
			providers: [
				{
					id: 'whatever',
					matcher: /^https?:\/\/(?:www\.)?vimeo\.com\//i,
					oembedEndpoint: 'https://vimeo.com/api/oembed.json',
				},
			],
		});
		await plugin.enrich(requestFor(URLS.vimeo), createMockPluginContext());
		expect(tuples()).toEqual([oembed('vimeo', 'hit')]);
	});
});

describe('oEmbed enrichment observer: anchored URL matching', () => {
	test.each([
		'https://evil.example/redirect?next=https://www.youtube.com/watch?v=abc123xyz89',
		'https://evil.example/#https://vimeo.com/22439234',
		'https://evil.example/?u=https://twitter.com/jack/status/20',
		'https://notyoutube.com/watch?v=abc123xyz89',
		'ftp://www.youtube.com/watch?v=abc123xyz89',
	])('%s is not supported and dials nothing', (url) => {
		const { fetch, urls } = recordingFetch(() => Response.json(body));
		const plugin = createOEmbedPlugin({ fetch });
		expect(plugin.supports(requestFor(url))).toBe(false);
		expect(urls).toEqual([]);
		expect(tuples()).toEqual([]);
	});

	test.each([
		['youtube', 'https://youtu.be/abc123xyz89'],
		['youtube', 'http://youtube.com/watch?v=abc123xyz89'],
		['twitter', 'https://x.com/jack/status/20'],
		['vimeo', 'https://www.vimeo.com/22439234'],
	])('%s: %s is still supported', (_id, url) => {
		const plugin = createOEmbedPlugin({ fetch: recordingFetch(() => Response.json(body)).fetch });
		expect(plugin.supports(requestFor(url))).toBe(true);
	});
});

describe('oEmbed enrichment observer: the engine artifact cache', () => {
	test.each(Object.entries(URLS))('a cached %s run is one source=cache hit', async (id, url) => {
		const { fetch, urls } = recordingFetch(() => Response.json(body));
		const engine = createEnrichmentEngine({
			cache: createMemoryCacheAdapter(),
			plugins: [createOEmbedPlugin({ fetch })],
		});
		await engine.enrich(requestFor(url));
		const second = await engine.enrich(requestFor(url));
		expect(second.timings.cacheHits).toBe(1);
		expect(urls).toHaveLength(1);
		expect(tuples()).toEqual([oembed(id, 'hit'), oembed(id, 'hit', 'none', 'cache')]);
	});
});

describe('oEmbed enrichment observer: engine deadline', () => {
	test.each(
		Object.entries(URLS)
	)('a hung %s upstream past the engine deadline is a timeout', async (id, url) => {
		const fetch = createPinAwareFetch(
			(_input: string, init?: RequestInit) =>
				new Promise<Response>((_resolve, reject) => {
					init?.signal?.addEventListener('abort', () =>
						reject(new DOMException('aborted', 'AbortError'))
					);
				})
		);
		const plugin = createOEmbedPlugin({ fetch });
		const controller = new AbortController();
		const deadlineAtMs = Date.now() + 10;
		setTimeout(() => controller.abort(), 30);
		await expect(
			plugin.enrich(
				requestFor(url),
				createMockPluginContext({ signal: controller.signal, deadlineAtMs })
			)
		).rejects.toThrow();
		expect(tuples()).toEqual([oembed(id, 'error', 'timeout')]);
	});
});
