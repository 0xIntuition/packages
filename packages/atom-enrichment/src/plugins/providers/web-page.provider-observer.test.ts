import { afterEach, beforeEach, describe, expect, mock, setDefaultTimeout, test } from 'bun:test';
import {
	addProviderObserver,
	type ProviderEvent,
	type ProviderRequestEvent,
	resetProviderObserversForTests,
} from '@0xintuition/pipeline-runtime/provider-observer';
import { createEnrichmentEngine } from '../../engine';
import type { EnrichmentPlugin } from '../../plugins';
import { createMockAtomInput, createMockPluginContext, createMockRequest } from '../../testing';
import { resetHostPolicyForTests } from './__shared__/host-policy';
import { createPinAwareFetch } from './__shared__/http';
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

setDefaultTimeout(20_000);

const resolveHostname = async () => [{ address: '93.184.216.34', family: 4 as const }];
const OG_HTML =
	'<html><head><title>T</title><meta property="og:title" content="An article"><meta property="og:type" content="article"></head><body>x</body></html>';
const BARE_HTML = '<html><head></head><body>nothing to read</body></html>';

let events: ProviderEvent[];
beforeEach(() => {
	resetHostPolicyForTests();
	events = [];
	resetProviderObserversForTests();
	addProviderObserver((event) => {
		events.push(event);
	});
});
afterEach(() => resetProviderObserversForTests());

/** Every page series event, goodreads and web alike: a paste must land in exactly one of them. */
const tuples = () =>
	events
		.filter(
			(event): event is ProviderRequestEvent =>
				event.type === 'provider_request' && event.operation === 'page'
		)
		.map((e) => `${e.provider}:${e.outcome}:${e.reason}:${e.source}`);

// Each test dials a host of its own: per-host pacing is process-wide.
let hostCounter = 0;
const freshUrl = (path = '/post') => `https://site-${++hostCounter}.example${path}`;

const request = (url: string, timeoutMs?: number) =>
	createMockRequest({
		...(timeoutMs === undefined ? {} : { timeoutMs }),
		input: createMockAtomInput({
			hints: { url },
			jsonLd: { '@context': 'https://schema.org', '@type': 'Article', name: 'A', url },
		}),
	});

function fetchReturning(respond: (url: string) => Response | Promise<Response>) {
	const urls: string[] = [];
	const fetcher = createPinAwareFetch(async (input) => {
		urls.push(input);
		return await respond(input);
	});
	return { fetcher, urls };
}

/** A server that never answers; like a real transport, the fetch ends when its signal aborts. */
const hangingFetch = () =>
	createPinAwareFetch(
		(_input, init) =>
			new Promise<Response>((_resolve, reject) => {
				init?.signal?.addEventListener('abort', () =>
					reject(Object.assign(new Error('aborted'), { name: 'AbortError' }))
				);
			})
	);

const bothPlugins = (fetcher: ReturnType<typeof fetchReturning>['fetcher']): EnrichmentPlugin[] => [
	createOpenGraphPlugin({ fetch: fetcher, resolveHostname }),
	createMicrodataPlugin({ fetch: fetcher, resolveHostname }),
];

const enrich = (fetcher: ReturnType<typeof fetchReturning>['fetcher'], url: string) =>
	createEnrichmentEngine({
		plugins: bothPlugins(fetcher),
		now: () => '2026-01-01T00:00:00.000Z',
	}).enrich(request(url));

const html = (body: string, init: ResponseInit = {}) =>
	new Response(body, { status: 200, headers: { 'content-type': 'text/html' }, ...init });

describe('web|page: every non-Goodreads page through the real engine, opengraph and microdata', () => {
	test('a normal article is one live hit and one cache hit, and records no goodreads series', async () => {
		const { fetcher, urls } = fetchReturning(() => html(OG_HTML));
		const url = freshUrl();
		const result = await enrich(fetcher, url);
		expect(result.errors).toEqual([]);
		expect(urls).toEqual([url]);
		expect(tuples()).toEqual(['web:hit:none:live', 'web:hit:none:cache']);
	});

	test('a 200 page with no metadata and no JSON-LD is still a hit: the page was fetched', async () => {
		const { fetcher } = fetchReturning(() => html(BARE_HTML));
		const result = await enrich(fetcher, freshUrl());
		expect(result.artifacts).toEqual([]);
		// Visible apart from a real hit on the live series; the cache consumer's event carries no reason.
		expect(tuples()).toEqual(['web:hit:no_metadata:live', 'web:hit:none:cache']);
	});

	test('a Goodreads paste records only goodreads|page, never web', async () => {
		const { fetcher } = fetchReturning(() => html(OG_HTML));
		await enrich(fetcher, 'https://www.goodreads.com/book/show/2657');
		expect(tuples()).toEqual(['goodreads:hit:none:live', 'goodreads:miss:none:cache']);
	});

	test('404 and 410 (dead_url) are a miss with reason dead_url (live only), cache a plain miss', async () => {
		for (const status of [404, 410]) {
			events.length = 0;
			const { fetcher } = fetchReturning(() => new Response('gone', { status }));
			await enrich(fetcher, freshUrl());
			expect(tuples()).toEqual(['web:miss:dead_url:live', 'web:miss:none:cache']);
		}
	});

	test('401, 403 and 451 (blocked) are recorded once, as blocked', async () => {
		for (const status of [401, 403, 451]) {
			events.length = 0;
			const { fetcher } = fetchReturning(() => new Response('no', { status }));
			await enrich(fetcher, freshUrl());
			expect(tuples()).toEqual(['web:error:blocked:live']);
		}
	});

	test('another 4xx stays http_4xx', async () => {
		const { fetcher } = fetchReturning(() => new Response('teapot', { status: 418 }));
		await enrich(fetcher, freshUrl());
		expect(tuples()).toEqual(['web:error:http_4xx:live']);
	});

	test('a 429 is rate_limited and the engine error keeps status and retryAfterMs', async () => {
		const { fetcher } = fetchReturning(
			() => new Response('slow down', { status: 429, headers: { 'retry-after': '7' } })
		);
		const result = await enrich(fetcher, freshUrl());
		expect(tuples()).toEqual(['web:error:rate_limited:live']);
		const og = result.errors.find((e) => e.pluginId === 'opengraph');
		expect(og?.code).toBe('rate_limited');
		expect(og?.retriable).toBe(true);
		expect(og?.details).toMatchObject({ status: 429 });
		expect(og?.details?.retryAfterMs).toBe(7000);
	});

	test('a 503 is upstream_5xx and the engine error keeps status and retryAfterMs', async () => {
		const { fetcher } = fetchReturning(
			() => new Response('down', { status: 503, headers: { 'retry-after': '3' } })
		);
		const result = await enrich(fetcher, freshUrl());
		expect(tuples()).toEqual(['web:error:upstream_5xx:live']);
		const og = result.errors.find((e) => e.pluginId === 'opengraph');
		expect(og?.code).toBe('upstream_error');
		expect(og?.retriable).toBe(true);
		expect(og?.details).toMatchObject({ status: 503 });
		expect(og?.details?.retryAfterMs).toBe(3000);
	});

	test('a retryable 408 stays retriable in the engine (status classes do not demote it)', async () => {
		const { fetcher } = fetchReturning(() => new Response('late', { status: 408 }));
		const result = await enrich(fetcher, freshUrl());
		const og = result.errors.find((e) => e.pluginId === 'opengraph');
		expect(og?.retriable).toBe(true);
		expect(og?.details).toMatchObject({ status: 408 });
	});

	test('Cloudflare and AWS WAF challenges are blocked whatever the status', async () => {
		for (const [status, headers] of [
			[200, { 'cf-mitigated': 'challenge' }],
			[403, { 'cf-mitigated': 'challenge' }],
			[405, { 'x-amzn-waf-action': 'captcha' }],
			[200, { 'x-amzn-waf-action': 'challenge' }],
		] as const) {
			events.length = 0;
			const { fetcher } = fetchReturning(() => html(OG_HTML, { status, headers }));
			await enrich(fetcher, freshUrl());
			expect(tuples()).toEqual(['web:error:blocked:live']);
		}
	});

	test('Goodreads-only rules do not apply: a bare 202 is a hit and an off-site redirect is followed', async () => {
		const bare = fetchReturning(() => html(OG_HTML, { status: 202 }));
		await enrich(bare.fetcher, freshUrl());
		expect(tuples()).toEqual(['web:hit:none:live', 'web:hit:none:cache']);

		events.length = 0;
		const target = freshUrl('/final');
		const redirecting = fetchReturning((url) =>
			url === target
				? html(OG_HTML)
				: new Response(null, { status: 302, headers: { location: target } })
		);
		await enrich(redirecting.fetcher, freshUrl('/start'));
		expect(redirecting.urls).toHaveLength(2);
		expect(tuples()).toEqual(['web:hit:none:live', 'web:hit:none:cache']);
	});

	test('a redirect loop ends on a 3xx: invalid_response', async () => {
		const { fetcher } = fetchReturning(
			() => new Response(null, { status: 302, headers: { location: '/again' } })
		);
		await enrich(fetcher, freshUrl());
		expect(tuples()).toEqual(['web:error:invalid_response:live']);
	});

	test('a transport failure is network', async () => {
		const fetcher = createPinAwareFetch(async () => {
			throw new TypeError('fetch failed');
		});
		await enrich(fetcher, freshUrl());
		expect(tuples()).toEqual(['web:error:network:live']);
	});

	test('a host that resolved but never answers (dns_not_found at the dial) is a dead URL: a miss', async () => {
		const fetcher = createPinAwareFetch(async () => {
			throw Object.assign(new Error('getaddrinfo ENOTFOUND'), { code: 'ENOTFOUND' });
		});
		await enrich(fetcher, freshUrl());
		// Recorded once, live: microdata's own read of the dead page is an error, and an error is never a cache event.
		expect(tuples()).toEqual(['web:miss:dead_url:live']);
	});

	describe('the pinned dial re-resolves the host: a resolver answering public first, then failing', () => {
		/** Call 1 (the pre-check) is public; every later call (the pinned dial) is `second`. */
		async function enrichWithSecondLookup(second: () => Promise<{ address: string; family: 4 }[]>) {
			let lookups = 0;
			const resolver = async () => {
				lookups += 1;
				return lookups === 1 ? [{ address: '93.184.216.34', family: 4 as const }] : second();
			};
			const { fetcher, urls } = fetchReturning(() => html(OG_HTML));
			const result = await createEnrichmentEngine({
				plugins: [
					createOpenGraphPlugin({ fetch: fetcher, resolveHostname: resolver }),
					createMicrodataPlugin({ fetch: fetcher, resolveHostname: resolver }),
				],
				now: () => '2026-01-01T00:00:00.000Z',
			}).enrich(request(freshUrl()));
			return { lookups, urls, result };
		}

		test('ENOTFOUND at the dial: the host stopped existing, a dead URL (miss), nothing dialled', async () => {
			const { lookups, urls } = await enrichWithSecondLookup(async () => {
				throw Object.assign(new Error('getaddrinfo ENOTFOUND'), { code: 'ENOTFOUND' });
			});
			expect(lookups).toBeGreaterThanOrEqual(2);
			expect(urls).toEqual([]);
			expect(tuples()).toEqual(['web:miss:dead_url:live']);
		});

		test('ESERVFAIL at the dial: a resolver fault, network, nothing dialled', async () => {
			const { lookups, urls } = await enrichWithSecondLookup(async () => {
				throw Object.assign(new Error('getaddrinfo ESERVFAIL'), { code: 'ESERVFAIL' });
			});
			expect(lookups).toBeGreaterThanOrEqual(2);
			expect(urls).toEqual([]);
			expect(tuples()).toEqual(['web:error:network:live']);
		});

		test('ETIMEOUT at the dial: network, nothing dialled', async () => {
			const { urls } = await enrichWithSecondLookup(async () => {
				throw Object.assign(new Error('queryA ETIMEOUT'), { code: 'ETIMEOUT' });
			});
			expect(urls).toEqual([]);
			expect(tuples()).toEqual(['web:error:network:live']);
		});

		test('a private answer at the dial (DNS rebinding) stays our own policy: nothing dialled, nothing recorded', async () => {
			const { urls } = await enrichWithSecondLookup(async () => [
				{ address: '10.0.0.5', family: 4 },
			]);
			expect(urls).toEqual([]);
			expect(tuples()).toEqual([]);
		});
	});

	test('a page that redirects to goodreads.com is recorded as web: the pasted page is what was fetched', async () => {
		const target = 'https://www.goodreads.com/book/show/1';
		const { fetcher, urls } = fetchReturning((url) =>
			url === target
				? html(OG_HTML)
				: new Response(null, { status: 302, headers: { location: target } })
		);
		await enrich(fetcher, freshUrl());
		expect(urls).toHaveLength(2);
		expect(tuples()).toEqual(['web:hit:none:live', 'web:hit:none:cache']);
	});

	test('an IMDb paste is refused by the plugins before any fetch: nothing dialled, nothing recorded', async () => {
		const { fetcher, urls } = fetchReturning(() => html(OG_HTML));
		await enrich(fetcher, 'https://www.imdb.com/title/tt0111161/');
		expect(urls).toEqual([]);
		expect(tuples()).toEqual([]);
	});

	test('a head that never closes within the size cap is one fetched page: a hit, once per plugin', async () => {
		const huge = `<html><head><title>${'x'.repeat(600 * 1024)}`;
		const { fetcher } = fetchReturning(() => html(huge));
		const result = await enrich(fetcher, freshUrl());
		expect(result.errors.map((e) => e.pluginId)).toEqual(['opengraph']);
		// opengraph records the live fetch (it read no metadata), microdata its cache read of the same page.
		expect(tuples()).toEqual(['web:hit:no_metadata:live', 'web:hit:none:cache']);
	});

	test('the engine deadline on a fetch that never answers is one live timeout', async () => {
		const fetcher = hangingFetch();
		const engine = createEnrichmentEngine({
			plugins: bothPlugins(fetcher),
			now: () => '2026-01-01T00:00:00.000Z',
		});
		// The request's timeout is the engine deadline of every plugin of the run.
		await engine.enrich(request(freshUrl(), 150));
		expect(tuples()).toEqual(['web:error:timeout:live']);
	});

	describe('a deadline reached while queued behind the same host, before anything is dialled', () => {
		const engineFor = (fetcher: ReturnType<typeof fetchReturning>['fetcher']) =>
			createEnrichmentEngine({
				plugins: bothPlugins(fetcher),
				now: () => '2026-01-01T00:00:00.000Z',
			});

		test('waiting for the slot of a slow fetch to the same host: the waiter records nothing, the fetch records its hit', async () => {
			const urls: string[] = [];
			const fetcher = createPinAwareFetch(async (input) => {
				urls.push(input);
				await new Promise((done) => setTimeout(done, 900));
				return html(OG_HTML);
			});
			const host = freshUrl('/a').replace('/a', '');
			const engine = engineFor(fetcher);
			const [a, b] = await Promise.all([
				engine.enrich(request(`${host}/a`, 10_000)),
				engine.enrich(request(`${host}/b`, 250)),
			]);
			expect(a.errors).toEqual([]);
			// B was never dialled, and its wait is our pacing, not a site that never answered.
			expect(b.errors.length).toBeGreaterThan(0);
			expect(urls).toEqual([`${host}/a`]);
			expect(tuples()).toEqual(['web:hit:none:live', 'web:hit:none:cache']);
		});

		test('waiting out the per-host spacing after the slot freed: nothing dialled, nothing recorded', async () => {
			const { fetcher, urls } = fetchReturning(() => html(OG_HTML));
			const host = freshUrl('/a').replace('/a', '');
			const engine = engineFor(fetcher);
			const [a] = await Promise.all([
				engine.enrich(request(`${host}/a`, 10_000)),
				engine.enrich(request(`${host}/b`, 120)),
			]);
			expect(a.errors).toEqual([]);
			expect(urls).toEqual([`${host}/a`]);
			expect(tuples()).toEqual(['web:hit:none:live', 'web:hit:none:cache']);
		});

		test('the same deadline once the page is being dialled is still a live timeout', async () => {
			const engine = engineFor(hangingFetch());
			await engine.enrich(request(freshUrl(), 150));
			expect(tuples()).toEqual(['web:error:timeout:live']);
		});
	});

	test('a caller cancel of the run records nothing', async () => {
		const fetcher = hangingFetch();
		const engine = createEnrichmentEngine({
			plugins: bothPlugins(fetcher),
			now: () => '2026-01-01T00:00:00.000Z',
		});
		const controller = new AbortController();
		const run = engine.enrich(request(freshUrl()), { signal: controller.signal });
		setTimeout(() => controller.abort(), 80);
		await run.catch(() => undefined);
		expect(tuples()).toEqual([]);
	});

	describe('a target our own policy refuses or that does not resolve is never dialled', () => {
		const run = async (
			url: string,
			resolver: () => Promise<never[] | { address: string; family: 4 }[]>
		) => {
			const urls: string[] = [];
			const fetcher = createPinAwareFetch(async (input) => {
				urls.push(input);
				return html(OG_HTML);
			});
			const engine = createEnrichmentEngine({
				plugins: [
					createOpenGraphPlugin({ fetch: fetcher, resolveHostname: resolver }),
					createMicrodataPlugin({ fetch: fetcher, resolveHostname: resolver }),
				],
				now: () => '2026-01-01T00:00:00.000Z',
			});
			const result = await engine.enrich(request(url));
			return { urls, result };
		};
		const privateAnswer = async () => [{ address: '10.0.0.5', family: 4 as const }];

		test('a domain that does not exist (NXDOMAIN) is a dead host: a miss, dead_url', async () => {
			const { urls } = await run(freshUrl(), async () => {
				throw Object.assign(new Error('getaddrinfo ENOTFOUND'), { code: 'ENOTFOUND' });
			});
			expect(urls).toEqual([]);
			expect(tuples()).toEqual(['web:miss:dead_url:live']);
		});

		test('a domain with no address records at all is a dead host too', async () => {
			const { urls } = await run(freshUrl(), async () => []);
			expect(urls).toEqual([]);
			expect(tuples()).toEqual(['web:miss:dead_url:live']);
		});

		test('a resolver that fails for another reason (a SERVFAIL, a timeout) is network, not dead', async () => {
			const { urls } = await run(freshUrl(), async () => {
				throw Object.assign(new Error('getaddrinfo EAI_AGAIN'), { code: 'EAI_AGAIN' });
			});
			expect(urls).toEqual([]);
			expect(tuples()).toEqual(['web:error:network:live']);
		});

		test('a public name that resolves to a private address is our policy: nothing recorded', async () => {
			const { urls } = await run(freshUrl(), privateAnswer);
			expect(urls).toEqual([]);
			expect(tuples()).toEqual([]);
		});

		test.each([
			'http://localhost/x',
			'http://10.0.0.5/x',
			'http://192.168.1.2/x',
			'https://printer.local/x',
			'http://[::1]/x',
		])('a paste of %s is our policy: nothing dialled, nothing recorded', async (pasted) => {
			const { urls } = await run(pasted, privateAnswer);
			expect(urls).toEqual([]);
			expect(tuples()).toEqual([]);
		});

		test('Goodreads keeps its rule: a failed lookup is network', async () => {
			const { urls } = await run('https://www.goodreads.com/book/show/1', async () => {
				throw Object.assign(new Error('getaddrinfo ENOTFOUND'), { code: 'ENOTFOUND' });
			});
			expect(urls).toEqual([]);
			expect(tuples()).toEqual(['goodreads:error:network:live']);
		});

		test('a redirect from a public page to a private address is our policy: nothing recorded', async () => {
			const fetcher = fetchReturning(
				() => new Response(null, { status: 302, headers: { location: 'http://10.0.0.9/admin' } })
			);
			const engine = createEnrichmentEngine({
				plugins: bothPlugins(fetcher.fetcher),
				now: () => '2026-01-01T00:00:00.000Z',
			});
			await engine.enrich(request(freshUrl()));
			expect(fetcher.urls).toHaveLength(1);
			expect(tuples()).toEqual([]);
		});

		test('a redirect from a public page to an embargoed host (IMDb) is our policy: nothing recorded', async () => {
			const fetcher = fetchReturning(
				() =>
					new Response(null, {
						status: 302,
						headers: { location: 'https://www.imdb.com/title/tt1/' },
					})
			);
			await enrich(fetcher.fetcher, freshUrl());
			expect(fetcher.urls).toHaveLength(1);
			expect(tuples()).toEqual([]);
		});
	});

	describe('Retry-After from a pasted page is capped like every provider hint', () => {
		const retryAfterOf = async (header: string | null) => {
			const headers: Record<string, string> = header === null ? {} : { 'retry-after': header };
			const { fetcher } = fetchReturning(() => new Response('slow', { status: 429, headers }));
			const result = await enrich(fetcher, freshUrl());
			return result.errors.map((e) => [e.pluginId, e.details?.retryAfterMs]);
		};

		test.each([
			['a year', '31536000'],
			['an absurd number', '1e20'],
			['zero', '0'],
			['garbage', 'soon'],
			['an HTTP-date in the far future', 'Wed, 21 Oct 2099 07:28:00 GMT'],
			['an HTTP-date in the past', 'Wed, 21 Oct 2015 07:28:00 GMT'],
		])('%s (%s) becomes the 30 s default for both plugins', async (_name, header) => {
			expect(await retryAfterOf(header)).toEqual([
				['opengraph', 30_000],
				['microdata', 30_000],
			]);
		});

		test('an honest value passes through, in seconds or as an HTTP-date', async () => {
			expect(await retryAfterOf('120')).toEqual([
				['opengraph', 120_000],
				['microdata', 120_000],
			]);
			const date = new Date(Date.now() + 120_000).toUTCString();
			const dated = await retryAfterOf(date);
			for (const [, ms] of dated) {
				expect(ms).toBeGreaterThan(100_000);
				expect(ms).toBeLessThanOrEqual(120_000);
			}
		});

		test('no header: no retryAfterMs at all', async () => {
			expect(await retryAfterOf(null)).toEqual([
				['opengraph', undefined],
				['microdata', undefined],
			]);
		});
	});
});

describe('web|page: microdata fallback fetch (a URL the opengraph page-source policy denies)', () => {
	const LOOPBACK = (port: number, path = '/p') => `http://127.0.0.1:${port}${path}`;
	const ctx = () => createMockPluginContext({ network: { allowLoopbackFixtures: true } });

	test('is observed as web|page, with WAF detection', async () => {
		const { fetcher, urls } = fetchReturning(() =>
			html(OG_HTML, { headers: { 'cf-mitigated': 'challenge' } })
		);
		const plugin = createMicrodataPlugin({ fetch: fetcher });
		await plugin.enrich(request(LOOPBACK(41001)), ctx());
		expect(urls).toHaveLength(1);
		expect(tuples()).toEqual(['web:error:blocked:live']);
	});

	test('through the real engine: observed, WAF-aware and paced like the opengraph fetch', async () => {
		const stamps: number[] = [];
		const { fetcher } = fetchReturning(() => {
			stamps.push(Date.now());
			return html(OG_HTML, { headers: { 'cf-mitigated': 'challenge' } });
		});
		const engine = createEnrichmentEngine({
			plugins: [createMicrodataPlugin({ fetch: fetcher })],
			network: { allowLoopbackFixtures: true },
			now: () => '2026-01-01T00:00:00.000Z',
		});
		await Promise.all([
			engine.enrich(request(LOOPBACK(41010, '/a'))),
			engine.enrich(request(LOOPBACK(41010, '/b'))),
		]);
		expect(tuples()).toEqual(['web:error:blocked:live', 'web:error:blocked:live']);
		expect((stamps[1] ?? 0) - (stamps[0] ?? 0)).toBeGreaterThanOrEqual(450);
	});

	test('a deadline while queued behind the same host records nothing; a dialled one still times out', async () => {
		const ld = '<script type="application/ld+json">{"@type":"Article","name":"A"}</script>';
		const { fetcher, urls } = fetchReturning(() => html(ld));
		const engine = createEnrichmentEngine({
			plugins: [createMicrodataPlugin({ fetch: fetcher })],
			network: { allowLoopbackFixtures: true },
			now: () => '2026-01-01T00:00:00.000Z',
		});
		await Promise.all([
			engine.enrich(request(LOOPBACK(41020, '/a'), 10_000)),
			engine.enrich(request(LOOPBACK(41020, '/b'), 400)),
		]);
		expect(urls).toEqual([LOOPBACK(41020, '/a')]);
		expect(tuples()).toEqual(['web:hit:none:live']);

		events.length = 0;
		await createEnrichmentEngine({
			plugins: [createMicrodataPlugin({ fetch: hangingFetch() })],
			network: { allowLoopbackFixtures: true },
			now: () => '2026-01-01T00:00:00.000Z',
		}).enrich(request(LOOPBACK(41021), 600));
		expect(tuples()).toEqual(['web:error:timeout:live']);
	});

	test('a 200 with JSON-LD is a hit and a 404 a miss', async () => {
		const ld = '<script type="application/ld+json">{"@type":"Article","name":"A"}</script>';
		const ok = fetchReturning(() => html(ld));
		await createMicrodataPlugin({ fetch: ok.fetcher }).enrich(request(LOOPBACK(41002)), ctx());
		const gone = fetchReturning(() => new Response('x', { status: 404 }));
		await createMicrodataPlugin({ fetch: gone.fetcher })
			.enrich(request(LOOPBACK(41003)), ctx())
			.catch(() => undefined);
		expect(tuples()).toEqual(['web:hit:none:live', 'web:miss:dead_url:live']);
	});

	test('is paced per host like the opengraph fetch', async () => {
		const stamps: number[] = [];
		const { fetcher } = fetchReturning(() => {
			stamps.push(Date.now());
			return html(BARE_HTML);
		});
		const plugin = createMicrodataPlugin({ fetch: fetcher });
		await Promise.all([
			plugin.enrich(request(LOOPBACK(41004, '/a')), ctx()),
			plugin.enrich(request(LOOPBACK(41004, '/b')), ctx()),
		]);
		expect(stamps).toHaveLength(2);
		expect((stamps[1] ?? 0) - (stamps[0] ?? 0)).toBeGreaterThanOrEqual(450);
	});
});
