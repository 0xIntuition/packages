import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';
import {
	addProviderObserver,
	type ProviderEvent,
	type ProviderRequestEvent,
	resetProviderObserversForTests,
} from '@0xintuition/pipeline-runtime/provider-observer';
import { createEnrichmentEngine } from '../../../engine';
import { createMockAtomInput, createMockPluginContext, createMockRequest } from '../../../testing';
import { resetHostPolicyForTests } from '../__shared__/host-policy';
import { createPinAwareFetch } from '../__shared__/http';
import { createMicrodataPlugin } from '../microdata';
import { createOpenGraphPlugin } from './index';

// mock-module-exempt: the shared provider hop resolves every target through node:dns before it
// dials; a real lookup would make these tests depend on the network. Nothing is dialled.
const realDns = await import('node:dns/promises');
mock.module('node:dns/promises', () => ({
	...realDns,
	default: realDns,
	lookup: async () => [{ address: '93.184.216.34', family: 4 }],
}));

const URL_ = 'https://www.goodreads.com/book/show/2657';
const resolveHostname = async () => [{ address: '93.184.216.34', family: 4 as const }];

let events: ProviderEvent[];
beforeEach(() => {
	// Pacing is process-wide: a deadline test must hit the dial, not an earlier test's spacing wait.
	resetHostPolicyForTests();
	events = [];
	resetProviderObserversForTests();
	addProviderObserver((event) => {
		events.push(event);
	});
});
afterEach(() => resetProviderObserversForTests());

const tuples = () =>
	events
		.filter((event): event is ProviderRequestEvent => event.type === 'provider_request')
		.map((e) => `${e.provider}:${e.operation}:${e.outcome}:${e.reason}`);

const request = (url = URL_) =>
	createMockRequest({
		input: createMockAtomInput({
			hints: { url },
			jsonLd: { '@context': 'https://schema.org', '@type': 'Book', name: 'Book', url },
		}),
	});

/** A fetch that honours the signal, like the real transport (which also throws when it is already aborted). */
const hangingFetch = () =>
	createPinAwareFetch(
		(_url, init) =>
			new Promise<Response>((_resolve, reject) => {
				const abort = () => reject(new DOMException('aborted', 'AbortError'));
				if (init?.signal?.aborted) abort();
				else init?.signal?.addEventListener('abort', abort);
			})
	);

describe('opengraph Goodreads page fetch', () => {
	test('its own timer records timeout when the fetch honours the signal', async () => {
		const plugin = createOpenGraphPlugin({
			fetch: hangingFetch(),
			resolveHostname,
			timeoutMs: 60,
		});
		await plugin.enrich(request(), createMockPluginContext()).catch(() => undefined);
		expect(tuples()).toEqual(['goodreads:page:error:timeout']);
	});

	test('its own timer records timeout even when the fetch ignores the signal and never settles', async () => {
		const plugin = createOpenGraphPlugin({
			fetch: createPinAwareFetch(() => new Promise<Response>(() => undefined)),
			resolveHostname,
			timeoutMs: 60,
		});
		// A fetch that never settles holds its host's pacing slot for good, so it gets a host of its own.
		const pending = plugin
			.enrich(request('https://goodreads.com/book/show/2657'), createMockPluginContext())
			.catch(() => undefined);
		await new Promise((resolve) => setTimeout(resolve, 200));
		expect(tuples()).toEqual(['goodreads:page:error:timeout']);
		void pending;
	});

	test('a caller abort before the deadline records nothing', async () => {
		const controller = new AbortController();
		const plugin = createOpenGraphPlugin({ fetch: hangingFetch(), resolveHostname });
		const pending = plugin
			.enrich(
				request(),
				createMockPluginContext({ signal: controller.signal, deadlineAtMs: Date.now() + 60_000 })
			)
			.catch(() => undefined);
		await new Promise((resolve) => setTimeout(resolve, 30));
		controller.abort();
		await pending;
		expect(tuples()).toEqual([]);
	});

	test('a pre-aborted signal records nothing', async () => {
		const controller = new AbortController();
		controller.abort();
		const plugin = createOpenGraphPlugin({ fetch: hangingFetch(), resolveHostname });
		await plugin
			.enrich(request(), createMockPluginContext({ signal: controller.signal }))
			.catch(() => undefined);
		expect(tuples()).toEqual([]);
	});

	test('an abort at the engine deadline records timeout', async () => {
		const controller = new AbortController();
		const plugin = createOpenGraphPlugin({ fetch: hangingFetch(), resolveHostname });
		const pending = plugin
			.enrich(
				request(),
				createMockPluginContext({ signal: controller.signal, deadlineAtMs: Date.now() + 40 })
			)
			.catch(() => undefined);
		await new Promise((resolve) => setTimeout(resolve, 80));
		controller.abort();
		await pending;
		expect(tuples()).toEqual(['goodreads:page:error:timeout']);
	});
});

describe('microdata Goodreads page fetch', () => {
	test('a 200 with JSON-LD is a hit and one without is a miss', async () => {
		const page = (body: string) =>
			createPinAwareFetch(
				async () => new Response(body, { headers: { 'content-type': 'text/html' } })
			);
		await createMicrodataPlugin({
			fetch: page('<script type="application/ld+json">{"@type":"Book","name":"B"}</script>'),
		}).enrich(request(), createMockPluginContext());
		await createMicrodataPlugin({ fetch: page('<html></html>') }).enrich(
			request(),
			createMockPluginContext()
		);
		expect(tuples()).toEqual(['goodreads:page:hit:none', 'goodreads:page:miss:none']);
	});

	test('a DNS failure on m.goodreads.com is network', async () => {
		const failing = createPinAwareFetch(async () => {
			throw Object.assign(new Error('getaddrinfo ENOTFOUND m.goodreads.com'), {
				code: 'ENOTFOUND',
			});
		});
		const mobile = createMockRequest({
			input: createMockAtomInput({
				hints: { url: 'https://m.goodreads.com/book/show/2657' },
				jsonLd: { '@context': 'https://schema.org', '@type': 'Book', name: 'B' },
			}),
		});
		await createMicrodataPlugin({ fetch: failing })
			.enrich(mobile, createMockPluginContext())
			.catch(() => undefined);
		expect(tuples()).toEqual(['goodreads:page:error:network']);
	});

	test('a caller abort records nothing; the deadline records timeout', async () => {
		const controller = new AbortController();
		const plugin = createMicrodataPlugin({ fetch: hangingFetch() });
		const pending = plugin
			.enrich(
				request(),
				createMockPluginContext({ signal: controller.signal, deadlineAtMs: Date.now() + 60_000 })
			)
			.catch(() => undefined);
		await new Promise((resolve) => setTimeout(resolve, 30));
		controller.abort();
		await pending;
		expect(tuples()).toEqual([]);

		// The first run reserved the host's spacing; the deadline must land on the dial, not on that wait.
		resetHostPolicyForTests();
		const deadline = new AbortController();
		const second = createMicrodataPlugin({ fetch: hangingFetch() })
			.enrich(
				request(),
				createMockPluginContext({ signal: deadline.signal, deadlineAtMs: Date.now() + 40 })
			)
			.catch(() => undefined);
		await new Promise((resolve) => setTimeout(resolve, 80));
		deadline.abort();
		await second;
		expect(tuples()).toEqual(['goodreads:page:error:timeout']);
	});
});

describe('goodreads|page through the real engine: our own per-host pacing queue', () => {
	const OG_HTML =
		'<html><head><title>T</title><meta property="og:title" content="A book"><meta property="og:type" content="book"></head><body>x</body></html>';
	const engineFor = (fetcher: ReturnType<typeof createPinAwareFetch>) =>
		createEnrichmentEngine({
			plugins: [
				createOpenGraphPlugin({ fetch: fetcher, resolveHostname }),
				createMicrodataPlugin({ fetch: fetcher, resolveHostname }),
			],
			now: () => '2026-01-01T00:00:00.000Z',
		});
	const withTimeout = (url: string, timeoutMs: number) =>
		createMockRequest({
			timeoutMs,
			input: createMockAtomInput({
				hints: { url },
				jsonLd: { '@context': 'https://schema.org', '@type': 'Book', name: 'Book', url },
			}),
		});

	test('a deadline reached while queued behind a slow fetch to goodreads.com records nothing', async () => {
		const urls: string[] = [];
		const fetcher = createPinAwareFetch(async (input) => {
			urls.push(input);
			await new Promise((done) => setTimeout(done, 900));
			return new Response(OG_HTML, { status: 200, headers: { 'content-type': 'text/html' } });
		});
		const engine = engineFor(fetcher);
		const first = `${URL_}`;
		const second = 'https://www.goodreads.com/book/show/9999';
		await Promise.all([
			engine.enrich(withTimeout(first, 10_000)),
			engine.enrich(withTimeout(second, 250)),
		]);
		// The waiter was never dialled, and its wait is our pacing: no timeout on the Goodreads series.
		expect(urls).toEqual([first]);
		expect(tuples()).toEqual(['goodreads:page:hit:none', 'goodreads:page:miss:none']);
	});

	test('the duration starts at the dial: the spacing wait is not part of goodreads|page latency', async () => {
		const fetcher = createPinAwareFetch(
			async () => new Response(OG_HTML, { status: 200, headers: { 'content-type': 'text/html' } })
		);
		const engine = engineFor(fetcher);
		await Promise.all([
			engine.enrich(withTimeout(URL_, 10_000)),
			engine.enrich(withTimeout('https://www.goodreads.com/book/show/9999', 10_000)),
		]);
		const live = events.filter(
			(e): e is ProviderRequestEvent =>
				e.type === 'provider_request' && e.provider === 'goodreads' && e.source === 'live'
		);
		expect(live).toHaveLength(2);
		// The second paste waited the 500 ms host spacing before it dialled; that wait is excluded.
		for (const event of live)
			expect(event.durationMs ?? Number.POSITIVE_INFINITY).toBeLessThan(300);
	});
});
