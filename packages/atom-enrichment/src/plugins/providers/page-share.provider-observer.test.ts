import { afterEach, beforeEach, describe, expect, mock, setDefaultTimeout, test } from 'bun:test';
import {
	addProviderObserver,
	type ProviderEvent,
	type ProviderRequestEvent,
	resetProviderObserversForTests,
} from '@0xintuition/pipeline-runtime/provider-observer';
import { createEnrichmentEngine } from '../../engine';
import type { EnrichmentPlugin } from '../../plugins';
import { createMockAtomInput, createMockRequest } from '../../testing';
import { BROWSER_FETCH_HEADERS, createPinAwareFetch } from './__shared__/http';
import { isSharedPageUrl } from './__shared__/shared-page';
import { createMicrodataPlugin } from './microdata';
import { createOpenGraphPlugin } from './opengraph';

// mock-module-exempt: the shared provider hop resolves every target through node:dns before it
// dials; a real lookup would make these tests depend on the network. Nothing is dialled.
const realDns = await import('node:dns/promises');
mock.module('node:dns/promises', () => ({
	...realDns,
	default: realDns,
	lookup: async () => [{ address: '93.184.216.34', family: 4 }],
}));

const resolveHostname = async () => [{ address: '93.184.216.34', family: 4 as const }];
const fixture = (name: string) =>
	Bun.file(new URL(`./opengraph/__fixtures__/${name}`, import.meta.url)).text();
const GOODREADS_HTML = await fixture('goodreads-book.html');
const PRODUCT_HTML = await fixture('product-page.html');
const LETTERBOXD_HTML = await fixture('letterboxd-film.html');
// What Letterboxd serves a non-browser user agent: the same page without its JSON-LD.
const LETTERBOXD_SHELL_HTML = LETTERBOXD_HTML.replace(
	/<script type="application\/ld\+json">[\s\S]*?<\/script>/,
	''
);
const userAgentOf = (init?: RequestInit) => new Headers(init?.headers).get('user-agent') ?? '';
// Captured on the unmodified plugins (commit 08bb50a1f, before the shared fetch) and never regenerated;
// the letterboxd entry (JSON-LD only in the body, only for a browser user agent) was captured the same
// way on 1b32e80b7 in the review round.
const GOLDEN_PATH = new URL('./opengraph/__fixtures__/page-share-golden.json', import.meta.url);

let events: ProviderEvent[];
beforeEach(() => {
	events = [];
	resetProviderObserversForTests();
	addProviderObserver((event) => {
		events.push(event);
	});
});
afterEach(() => resetProviderObserversForTests());

const pageEvents = () =>
	events.filter(
		(event): event is ProviderRequestEvent =>
			event.type === 'provider_request' && event.provider === 'goodreads'
	);

const request = (url: string) =>
	createMockRequest({
		input: createMockAtomInput({
			hints: { url },
			jsonLd: { '@context': 'https://schema.org', '@type': 'Thing', name: 'Thing', url },
		}),
	});

function countingFetch(respond: (url: string, init?: RequestInit) => Response | Promise<Response>) {
	const urls: string[] = [];
	const fetcher = createPinAwareFetch(async (input, init) => {
		urls.push(input);
		return await respond(input, init);
	});
	return { fetcher, urls };
}

function bothPlugins(fetcher: ReturnType<typeof countingFetch>['fetcher']): EnrichmentPlugin[] {
	return [
		createOpenGraphPlugin({ fetch: fetcher, resolveHostname }),
		createMicrodataPlugin({ fetch: fetcher, resolveHostname }),
	];
}

const engineFor = (plugins: EnrichmentPlugin[]) =>
	createEnrichmentEngine({ plugins, now: () => '2026-01-01T00:00:00.000Z' });

const html = (body: string) =>
	new Response(body, { status: 200, headers: { 'content-type': 'text/html' } });

const tuples = () => pageEvents().map((e) => `${e.outcome}:${e.reason}:${e.source}`);

const GOODREADS_URL = 'https://www.goodreads.com/book/show/2657';
const PRODUCT_URL = 'https://acme.example/widget';
const LETTERBOXD_URL = 'https://letterboxd.com/film/example-film/';

describe('opengraph + microdata share one page fetch per run (ENG-16980)', () => {
	setDefaultTimeout(20_000);
	test('a Goodreads paste performs exactly one network fetch', async () => {
		const { fetcher, urls } = countingFetch(() => html(GOODREADS_HTML));
		const result = await engineFor(bothPlugins(fetcher)).enrich(request(GOODREADS_URL));

		expect(result.errors).toEqual([]);
		expect(result.artifacts.map((a) => a.artifact_type).sort()).toEqual(['microdata', 'opengraph']);
		expect(urls).toEqual([GOODREADS_URL]);
		// One live fetch event, and the second consumer's cache event with its own outcome.
		expect(tuples()).toEqual(['hit:none:live', 'hit:none:cache']);
		expect(pageEvents().find((e) => e.source === 'cache')?.durationMs).toBeUndefined();
	});

	test('the one request carries the browser headers microdata needs', async () => {
		const seen: Array<Record<string, string>> = [];
		const fetcher = createPinAwareFetch(async (_url, init) => {
			seen.push(init?.headers as Record<string, string>);
			return html(GOODREADS_HTML);
		});
		await engineFor(bothPlugins(fetcher)).enrich(request(GOODREADS_URL));
		expect(seen).toHaveLength(1);
		expect(seen[0]?.['user-agent']).toBe(BROWSER_FETCH_HEADERS['User-Agent']);
		expect(seen[0]?.['accept-language']).toBe(BROWSER_FETCH_HEADERS['Accept-Language']);
		expect(seen[0]?.accept).toBe(BROWSER_FETCH_HEADERS.Accept);
	});

	test('a non-Goodreads page is also fetched once and records no Goodreads series', async () => {
		const { fetcher, urls } = countingFetch(() => html(PRODUCT_HTML));
		const result = await engineFor(bothPlugins(fetcher)).enrich(request(PRODUCT_URL));
		expect(result.artifacts).toHaveLength(2);
		expect(urls).toEqual([PRODUCT_URL]);
		expect(tuples()).toEqual([]);
	});

	test('the opengraph plugin alone (own-provider-only preview) still fetches once', async () => {
		const { fetcher, urls } = countingFetch(() => html(GOODREADS_HTML));
		const result = await engineFor([
			createOpenGraphPlugin({ fetch: fetcher, resolveHostname }),
		]).enrich(request(GOODREADS_URL));
		expect(result.artifacts.map((a) => a.artifact_type)).toEqual(['opengraph']);
		expect(urls).toHaveLength(1);
		expect(tuples()).toEqual(['hit:none:live']);
	});

	test('concurrent consumers share one in-flight request', async () => {
		let release: () => void = () => undefined;
		const gate = new Promise<void>((resolve) => {
			release = resolve;
		});
		const { fetcher, urls } = countingFetch(async () => {
			await gate;
			return html(GOODREADS_HTML);
		});
		const running = engineFor(bothPlugins(fetcher)).enrich(request(GOODREADS_URL));
		try {
			// The host's pacing may delay the dial; wait for it, then give a second request time to show up.
			const deadline = Date.now() + 3000;
			while (urls.length === 0 && Date.now() < deadline) {
				await new Promise((resolve) => setTimeout(resolve, 20));
			}
			await new Promise((resolve) => setTimeout(resolve, 700));
			expect(urls).toHaveLength(1);
		} finally {
			release();
		}
		const result = await running;
		expect(result.artifacts).toHaveLength(2);
		expect(urls).toHaveLength(1);
	});

	test('two runs of the same URL fetch twice: nothing is reused across runs', async () => {
		const { fetcher, urls } = countingFetch(() => html(PRODUCT_HTML));
		const engine = engineFor(bothPlugins(fetcher));
		await engine.enrich(request(PRODUCT_URL));
		await engine.enrich(request(PRODUCT_URL));
		expect(urls).toEqual([PRODUCT_URL, PRODUCT_URL]);
		// Concurrent runs do not share an in-flight request either.
		urls.length = 0;
		await Promise.all([engine.enrich(request(PRODUCT_URL)), engine.enrich(request(PRODUCT_URL))]);
		expect(urls).toEqual([PRODUCT_URL, PRODUCT_URL]);
	});

	test('a WAF challenge is fetched once and reaches both plugins as blocked, recorded once', async () => {
		const { fetcher, urls } = countingFetch(
			() =>
				new Response('<html>challenge</html>', {
					status: 202,
					headers: { 'x-amzn-waf-action': 'challenge' },
				})
		);
		const result = await engineFor(bothPlugins(fetcher)).enrich(request(GOODREADS_URL));
		expect(urls).toHaveLength(1);
		expect(result.artifacts).toEqual([]);
		expect(result.errors).toEqual([]);
		expect(tuples()).toEqual(['error:blocked:live']);
	});

	test('a failing fetch is made once and the same error reaches both plugins', async () => {
		const { fetcher, urls } = countingFetch(() => new Response('down', { status: 503 }));
		const result = await engineFor(bothPlugins(fetcher)).enrich(request(GOODREADS_URL));
		expect(urls).toHaveLength(1);
		expect(result.artifacts).toEqual([]);
		expect(result.errors.map((e) => e.pluginId).sort()).toEqual(['microdata', 'opengraph']);
		expect(tuples()).toEqual(['error:upstream_5xx:live']);
	});

	test('only pages the opengraph policy admits use the shared path', () => {
		expect(isSharedPageUrl(GOODREADS_URL)).toBe(true);
		expect(isSharedPageUrl(PRODUCT_URL)).toBe(true);
		expect(isSharedPageUrl('https://www.imdb.com/title/tt0000001/')).toBe(false);
		expect(isSharedPageUrl('https://m.imdb.com/title/tt0000001/')).toBe(false);
		expect(isSharedPageUrl('ftp://acme.example/widget')).toBe(false);
		expect(isSharedPageUrl('not a url')).toBe(false);
	});

	test('golden: both plugins produce the same artifacts as before the shared fetch', async () => {
		const golden: Record<string, unknown> = {};
		for (const [name, url, body] of [
			['goodreads', GOODREADS_URL, GOODREADS_HTML],
			['product', PRODUCT_URL, PRODUCT_HTML],
			['letterboxd', LETTERBOXD_URL, LETTERBOXD_HTML],
		] as const) {
			// Letterboxd serves its JSON-LD (here in the body, not the head) to a browser user agent only.
			const { fetcher } = countingFetch((_url, init) =>
				html(
					name === 'letterboxd' && !userAgentOf(init).includes('Mozilla')
						? LETTERBOXD_SHELL_HTML
						: body
				)
			);
			const result = await engineFor(bothPlugins(fetcher)).enrich(request(url));
			golden[name] = [...result.artifacts].sort((a, b) =>
				a.artifact_type.localeCompare(b.artifact_type)
			);
		}
		const expected = JSON.parse(await Bun.file(GOLDEN_PATH).text());
		expect(JSON.parse(JSON.stringify(golden))).toEqual(expected);
		// Both artifact types exist for both pages, so an empty golden can never pass.
		expect(Object.keys(expected)).toEqual(['goodreads', 'product', 'letterboxd']);
		for (const key of Object.keys(expected)) expect(expected[key]).toHaveLength(2);
	});
});

/** A fetch that answers after `delayMs`, and reports whether the request it was given got aborted. */
function slowFetch(delayMs: number, body = PRODUCT_HTML) {
	const state = { aborted: false, urls: [] as string[] };
	const fetcher = createPinAwareFetch(
		(input, init) =>
			new Promise<Response>((resolve, reject) => {
				state.urls.push(input);
				const timer = setTimeout(() => resolve(html(body)), delayMs);
				init?.signal?.addEventListener('abort', () => {
					clearTimeout(timer);
					state.aborted = true;
					reject(init.signal?.reason);
				});
			})
	);
	return { fetcher, state };
}

const messageOf = (
	result: Awaited<ReturnType<ReturnType<typeof engineFor>['enrich']>>,
	id: string
) => result.errors.find((e) => e.pluginId === id)?.message;

describe('a consumer cannot decide the outcome for the others (ENG-16980 review)', () => {
	setDefaultTimeout(20_000);
	// opengraph's own timer is 150 ms; the page takes 600 ms; microdata has no timer of its own.
	for (const [label, opengraphPriority] of [
		['opengraph fetches first', 10],
		['microdata fetches first', 20],
	] as const) {
		test(`opengraph timing out alone does not fail microdata (${label})`, async () => {
			const { fetcher, state } = slowFetch(600);
			const result = await engineFor([
				createOpenGraphPlugin({
					fetch: fetcher,
					resolveHostname,
					timeoutMs: 150,
					priority: opengraphPriority,
				}),
				createMicrodataPlugin({ fetch: fetcher, resolveHostname }),
			]).enrich(request(PRODUCT_URL));

			expect(state.urls).toEqual([PRODUCT_URL]);
			expect(state.aborted).toBe(false);
			expect(result.artifacts.map((a) => a.artifact_type)).toEqual(['microdata']);
			expect(result.errors.map((e) => e.pluginId)).toEqual(['opengraph']);
			expect(messageOf(result, 'opengraph')).toBe('OpenGraph fetch timed out.');
		});
	}

	test('the request is abandoned once every consumer has given up', async () => {
		const { fetcher, state } = slowFetch(10_000);
		const started = Date.now();
		const result = await engineFor(bothPlugins(fetcher)).enrich({
			...request(PRODUCT_URL),
			timeoutMs: 300,
		});
		expect(Date.now() - started).toBeLessThan(5000);
		expect(result.artifacts).toEqual([]);
		expect(result.errors.map((e) => e.pluginId).sort()).toEqual(['microdata', 'opengraph']);
		// Nobody was left to read the page, so the dial was aborted instead of running to its end.
		expect(state.aborted).toBe(true);
		expect(state.urls).toHaveLength(1);
	});

	test('plugins configured with different transports or resolvers do not share a request', async () => {
		const a = countingFetch(() => html(PRODUCT_HTML));
		const b = countingFetch(() => html(PRODUCT_HTML));
		await engineFor([
			createOpenGraphPlugin({ fetch: a.fetcher, resolveHostname }),
			createMicrodataPlugin({ fetch: b.fetcher, resolveHostname }),
		]).enrich(request(PRODUCT_URL));
		expect(a.urls).toEqual([PRODUCT_URL]);
		expect(b.urls).toEqual([PRODUCT_URL]);

		const c = countingFetch(() => html(PRODUCT_HTML));
		await engineFor([
			createOpenGraphPlugin({ fetch: c.fetcher, resolveHostname }),
			createMicrodataPlugin({
				fetch: c.fetcher,
				resolveHostname: async () => [{ address: '93.184.216.35', family: 4 as const }],
			}),
		]).enrich(request(PRODUCT_URL));
		expect(c.urls).toEqual([PRODUCT_URL, PRODUCT_URL]);
	});
});

/** A page streamed in 4 KB chunks after its head; reports how many chunks were pulled and whether it was cancelled. */
function streamingPage(chunks = 200) {
	const stats = { pulled: 0, cancelled: false };
	const fetcher = createPinAwareFetch(async () => {
		const encoder = new TextEncoder();
		return new Response(
			new ReadableStream({
				pull(controller) {
					stats.pulled += 1;
					if (stats.pulled > chunks) return controller.close();
					controller.enqueue(
						encoder.encode(
							stats.pulled === 1
								? '<html><head><title>T</title><meta property="og:title" content="T"></head><body>'
								: 'y'.repeat(4096)
						)
					);
				},
				cancel() {
					stats.cancelled = true;
				},
			}),
			{ status: 200, headers: { 'content-type': 'text/html' } }
		);
	});
	return { fetcher, stats };
}

describe('the body is read only when a plugin of the run reads it (ENG-16980 review)', () => {
	test('an opengraph-only run stops at </head>, as before sharing', async () => {
		const { fetcher, stats } = streamingPage();
		const result = await engineFor([
			createOpenGraphPlugin({ fetch: fetcher, resolveHostname }),
		]).enrich(request(PRODUCT_URL));
		expect(result.artifacts.map((a) => a.artifact_type)).toEqual(['opengraph']);
		expect(stats.pulled).toBeLessThanOrEqual(2);
		expect(stats.cancelled).toBe(true);
	});

	test('a run with microdata reads the whole page (about 800 KB here)', async () => {
		const { fetcher, stats } = streamingPage();
		await engineFor(bothPlugins(fetcher)).enrich(request(PRODUCT_URL));
		expect(stats.pulled).toBeGreaterThan(190);
		expect(stats.cancelled).toBe(false);
	});

	test('microdata alone reads the whole page too', async () => {
		const { fetcher, stats } = streamingPage();
		await engineFor([createMicrodataPlugin({ fetch: fetcher, resolveHostname })]).enrich(
			request(PRODUCT_URL)
		);
		expect(stats.pulled).toBeGreaterThan(190);
	});
});

describe('user agent of the shared request (ENG-16980 review)', () => {
	const agentsFor = async (url: string) => {
		const seen: string[] = [];
		const fetcher = createPinAwareFetch(async (_url, init) => {
			seen.push(userAgentOf(init));
			return html(PRODUCT_HTML);
		});
		await engineFor(bothPlugins(fetcher)).enrich(request(url));
		return seen;
	};

	test('Wikimedia hosts get the descriptive user agent their policy asks for', async () => {
		for (const url of [
			'https://en.wikipedia.org/wiki/Mockingbird',
			'https://commons.wikimedia.org/wiki/Main_Page',
		]) {
			const seen = await agentsFor(url);
			expect(seen).toHaveLength(1);
			expect(seen[0]).toContain('IntuitionSeedControlPlane/1.0');
		}
	});

	test('every other host, including look-alikes, gets the browser user agent', async () => {
		for (const url of [
			PRODUCT_URL,
			LETTERBOXD_URL,
			GOODREADS_URL,
			'https://notwikipedia.org/wiki/x',
			'https://wikipedia.org.evil.example/wiki/x',
		]) {
			const seen = await agentsFor(url);
			expect(seen).toEqual([BROWSER_FETCH_HEADERS['User-Agent'] as string]);
		}
	});
});

describe('plugins called outside the engine with a hand-built cache (ENG-16980 review)', () => {
	test('a cache that does not know its consumers still gives each plugin the page it needs', async () => {
		const { createRunPageCache } = await import('../../page-cache');
		const { fetcher, urls } = countingFetch(() => html(PRODUCT_HTML));
		const pages = createRunPageCache();
		const ctx = {
			now: () => '2026-01-01T00:00:00.000Z',
			signal: new AbortController().signal,
			pages,
		};
		const req = request(PRODUCT_URL);
		const [og] = bothPlugins(fetcher);
		const md = createMicrodataPlugin({ fetch: fetcher, resolveHostname });
		const og1 = await og?.enrich(req, ctx);
		const md1 = await md.enrich(req, ctx);
		expect(og1?.map((a) => a.artifact_type)).toEqual(['opengraph']);
		// microdata needs the body, which a head-only request did not keep: it is not served that one.
		expect(md1.map((a) => a.artifact_type)).toEqual(['microdata']);
		expect(urls).toEqual([PRODUCT_URL, PRODUCT_URL]);
	});

	test('with no cache at all each plugin fetches for itself', async () => {
		const { fetcher, urls } = countingFetch(() => html(PRODUCT_HTML));
		const ctx = { now: () => '2026-01-01T00:00:00.000Z', signal: new AbortController().signal };
		const [og] = bothPlugins(fetcher);
		const md = createMicrodataPlugin({ fetch: fetcher, resolveHostname });
		expect(await og?.enrich(request(PRODUCT_URL), ctx)).toHaveLength(1);
		expect(await md.enrich(request(PRODUCT_URL), ctx)).toHaveLength(1);
		expect(urls).toHaveLength(2);
	});
});
