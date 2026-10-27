import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import {
	addProviderObserver,
	type ProviderEvent,
	type ProviderRequestEvent,
	resetProviderObserversForTests,
} from '@0xintuition/pipeline-runtime/provider-observer';
import {
	createRequestSlot,
	resetProcessRequestSlotsForTests,
} from '@0xintuition/pipeline-runtime/request-slot';
import { createHeldRequestSlot } from '@0xintuition/pipeline-runtime/testing/held-request-slot';
import { createMemoryCacheAdapter } from '../../../cache';
import { createEnrichmentEngine } from '../../../engine';
import { createMockAtomInput, createMockRequest, useStubbedPublicDns } from '../../../testing';
import { createPinAwareFetch, type FetchLike } from '../__shared__/http';
import { WIKIMEDIA_USER_AGENT } from '../__shared__/provider-fetch';
import entityFixture from '../wikidata/__fixtures__/entity.json';
import summaryFixture from './__fixtures__/summary.json';
import { createWikipediaPlugin } from './index';

useStubbedPublicDns();

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
const wikipedia = (
	operation: ProviderRequestEvent['operation'],
	outcome: ProviderRequestEvent['outcome'],
	reason: ProviderRequestEvent['reason'] = 'none'
) => ({ provider: 'wikipedia' as const, operation, outcome, reason, source: 'live' as const });
const wikidata = (
	outcome: ProviderRequestEvent['outcome'],
	reason: ProviderRequestEvent['reason'] = 'none'
) => ({
	provider: 'wikidata' as const,
	operation: 'entity' as const,
	outcome,
	reason,
	source: 'live' as const,
});

beforeEach(() => {
	events = [];
	resetProcessRequestSlotsForTests();
	resetProviderObserversForTests();
	addProviderObserver((event) => {
		events.push(event);
	});
});
afterEach(() => {
	resetProviderObserversForTests();
	resetProcessRequestSlotsForTests();
});

const summary = { ...summaryFixture, wikibase_item: 'Q12345' };
const entityResponse = () =>
	Response.json({ entities: { Q12345: { ...entityFixture.entities.Q12345, id: 'Q12345' } } });

function plugin(fetch: FetchLike) {
	return createWikipediaPlugin({
		fetch: createPinAwareFetch(fetch),
		requestSlot: createRequestSlot({ minSpacingMs: 0 }),
	});
}

// A title-only request: the plugin checks type agreement through Wikidata.
const titleRequest = () =>
	createMockRequest({
		input: createMockAtomInput({
			jsonLd: { '@context': 'https://schema.org', '@type': 'Organization', name: 'Acme Labs' },
			hints: { name: 'Acme Labs' },
		}),
	});
// A Wikipedia URL: the title is trusted, there is no Wikidata lookup.
const urlRequest = () =>
	createMockRequest({
		input: createMockAtomInput({
			hints: { name: 'Acme Labs', url: 'https://en.wikipedia.org/wiki/Acme_Labs' },
		}),
	});

const route = (url: string) =>
	url.includes('/page/summary/') ? Response.json(summary) : entityResponse();

describe('Wikipedia request observer: summary', () => {
	test('a URL request records one summary hit with a duration and sends the Wikimedia User-Agent', async () => {
		const seen: Array<string | null> = [];
		const result = await createEnrichmentEngine({
			plugins: [
				plugin(async (url, init) => {
					seen.push(new Headers(init?.headers).get('user-agent'));
					return route(url);
				}),
			],
		}).enrich(urlRequest());
		expect(result.artifacts).toHaveLength(1);
		expect(tuples()).toEqual([wikipedia('summary', 'hit')]);
		expect(typeof requests()[0]?.durationMs).toBe('number');
		expect(seen).toEqual([WIKIMEDIA_USER_AGENT]);
	});

	test('a 404 is a miss in the metric and no error in the engine', async () => {
		const result = await createEnrichmentEngine({
			plugins: [
				plugin(async () => Response.json({ status: 404, type: 'Internal error' }, { status: 404 })),
			],
		}).enrich(urlRequest());
		expect(tuples()).toEqual([wikipedia('summary', 'miss')]);
		expect(result.errors).toEqual([]);
		expect(result.artifacts).toEqual([]);
		expect(result.status).toBe('success');
	});

	test('429 is rate_limited (Retry-After kept), 403 is auth_failed, 500 is upstream_5xx', async () => {
		const limited = await createEnrichmentEngine({
			plugins: [
				plugin(async () => new Response('', { status: 429, headers: { 'retry-after': '7' } })),
			],
		}).enrich(urlRequest());
		expect(limited.errors).toMatchObject([
			{ code: 'rate_limited', retriable: true, details: { retryAfterMs: 7_000 } },
		]);
		await createEnrichmentEngine({
			plugins: [plugin(async () => new Response('', { status: 403 }))],
		}).enrich(urlRequest());
		await createEnrichmentEngine({
			plugins: [plugin(async () => new Response('', { status: 500 }))],
		}).enrich(urlRequest());
		expect(tuples()).toEqual([
			wikipedia('summary', 'error', 'rate_limited'),
			wikipedia('summary', 'error', 'auth_failed'),
			wikipedia('summary', 'error', 'upstream_5xx'),
		]);
	});
});

describe('Wikipedia secondary Wikidata lookup', () => {
	test('a title request records summary then wikidata|entity, both with the User-Agent', async () => {
		const seen: Array<string | null> = [];
		const result = await createEnrichmentEngine({
			plugins: [
				plugin(async (url, init) => {
					seen.push(new Headers(init?.headers).get('user-agent'));
					return route(url);
				}),
			],
		}).enrich(titleRequest());
		expect(result.artifacts).toHaveLength(1);
		expect(tuples()).toEqual([wikipedia('summary', 'hit'), wikidata('hit')]);
		expect(seen).toEqual([WIKIMEDIA_USER_AGENT, WIKIMEDIA_USER_AGENT]);
	});

	for (const [name, respond, reason] of [
		['a 500', () => new Response('', { status: 500 }), 'upstream_5xx'],
		['a 429', () => new Response('', { status: 429 }), 'rate_limited'],
		['an unparseable body', () => new Response('<html>', { status: 200 }), 'invalid_response'],
	] as const) {
		test(`${name} on the optional EntityData lookup keeps the Wikipedia artifact and records the failure`, async () => {
			const result = await createEnrichmentEngine({
				plugins: [plugin(async (url) => (url.includes('/page/summary/') ? route(url) : respond()))],
			}).enrich(titleRequest());
			expect(result.errors).toEqual([]);
			expect(result.artifacts).toHaveLength(1);
			expect(result.artifacts[0]?.meta).toMatchObject({ identityStrength: 'title' });
			expect(tuples()).toEqual([wikipedia('summary', 'hit'), wikidata('error', reason)]);
		});
	}

	test('a 404 on the EntityData lookup keeps the artifact too and records a miss', async () => {
		const result = await createEnrichmentEngine({
			plugins: [
				plugin(async (url) =>
					url.includes('/page/summary/') ? route(url) : new Response('', { status: 404 })
				),
			],
		}).enrich(titleRequest());
		expect(result.artifacts).toHaveLength(1);
		expect(tuples()).toEqual([wikipedia('summary', 'hit'), wikidata('miss')]);
	});

	test('a deadline during the secondary lookup is still the run timing out, not a kept artifact', async () => {
		const result = await createEnrichmentEngine({
			plugins: [
				plugin(async (url) =>
					url.includes('/page/summary/') ? route(url) : new Promise<Response>(() => {})
				),
			],
		}).enrich({ ...titleRequest(), timeoutMs: 60 });
		expect(result.artifacts).toEqual([]);
		expect(result.errors.map((error) => error.code)).toEqual(['timeout']);
		expect(tuples()).toEqual([wikipedia('summary', 'hit'), wikidata('error', 'timeout')]);
	});

	test('a caller cancelling during the secondary lookup ends the run and keeps nothing', async () => {
		const external = new AbortController();
		const settled = await createEnrichmentEngine({
			plugins: [
				plugin(async (url) => {
					if (url.includes('/page/summary/')) return route(url);
					// Cancel from inside the hanging secondary lookup: no timer, no race.
					queueMicrotask(() => external.abort(new Error('user left')));
					return new Promise<Response>(() => {});
				}),
			],
		})
			.enrich({ ...titleRequest(), timeoutMs: 5_000 }, { signal: external.signal })
			.then(
				(result) => ({ result }),
				(error: unknown) => ({ error })
			);
		// The engine resolves (it never rejects) with the abort reason, no artifact and not a timeout.
		expect(settled).toHaveProperty('result');
		const { result } = settled as {
			result: Awaited<ReturnType<ReturnType<typeof createEnrichmentEngine>['enrich']>>;
		};
		expect(result.status).toBe('failed');
		expect(result.artifacts).toEqual([]);
		expect(result.errors).toEqual([
			{ pluginId: 'wikipedia', code: 'internal_error', message: 'user left', retriable: false },
		]);
		// The caller cancel records nothing for the lookup it interrupted.
		expect(tuples()).toEqual([wikipedia('summary', 'hit')]);
	});
});

// No name, no entity id and no URL: nothing for the provider to look up.
const nameless = () =>
	createMockRequest({
		input: createMockAtomInput({
			jsonLd: { '@context': 'https://schema.org', '@type': 'Thing' },
			hints: {},
		}),
	});

describe('Wikipedia engine cache observation', () => {
	test('a second run served from the artifact cache records one source=cache summary hit and no dial', async () => {
		let dials = 0;
		const engine = createEnrichmentEngine({
			cache: createMemoryCacheAdapter(),
			plugins: [
				plugin(async (url) => {
					dials += 1;
					return route(url);
				}),
			],
		});
		await engine.enrich(urlRequest());
		const second = await engine.enrich(urlRequest());
		expect(dials).toBe(1);
		expect(second.timings.cacheHits).toBe(1);
		expect(tuples()).toEqual([
			wikipedia('summary', 'hit'),
			{ ...wikipedia('summary', 'hit'), source: 'cache' },
		]);
	});

	test('a cached 404 run records exactly one source=cache miss', async () => {
		let dials = 0;
		const engine = createEnrichmentEngine({
			cache: createMemoryCacheAdapter(),
			plugins: [
				plugin(async () => {
					dials += 1;
					return new Response('{}', { status: 404 });
				}),
			],
		});
		await engine.enrich(urlRequest());
		const second = await engine.enrich(urlRequest());
		expect(dials).toBe(1);
		expect(second.timings.cacheHits).toBe(1);
		expect(tuples()).toEqual([
			wikipedia('summary', 'miss'),
			{ ...wikipedia('summary', 'miss'), source: 'cache' },
		]);
	});

	test('a request Wikipedia does not support declares no cache operation', () => {
		const instance = createWikipediaPlugin();
		expect(instance.observability?.cacheOperations(nameless())).toEqual([]);
		expect(instance.observability?.cacheOperations(urlRequest())).toEqual(['summary']);
	});
});

describe('Wikipedia pacing-slot refusals are budget_exhausted (ENG-17085)', () => {
	const withSlot = (fetch: FetchLike, requestSlot: ReturnType<typeof createRequestSlot>) =>
		createWikipediaPlugin({ fetch: createPinAwareFetch(fetch), requestSlot });

	test('a full slot queue is one summary budget_exhausted without a duration or a dial', async () => {
		let dials = 0;
		await createEnrichmentEngine({
			plugins: [
				withSlot(async (url) => {
					dials += 1;
					return route(url);
				}, createHeldRequestSlot(0)),
			],
		}).enrich(urlRequest());
		expect(dials).toBe(0);
		expect(tuples()).toEqual([wikipedia('summary', 'budget_exhausted')]);
		expect(requests()[0]).not.toHaveProperty('durationMs');
	});

	test('the engine deadline while the summary waits for its turn is budget_exhausted, never a timeout', async () => {
		let dials = 0;
		await createEnrichmentEngine({
			plugins: [
				withSlot(async (url) => {
					dials += 1;
					return route(url);
				}, createHeldRequestSlot()),
			],
		}).enrich({ ...urlRequest(), timeoutMs: 40 });
		await new Promise((resolve) => setTimeout(resolve, 30));
		expect(dials).toBe(0);
		expect(tuples()).toEqual([wikipedia('summary', 'budget_exhausted')]);
		expect(requests()[0]).not.toHaveProperty('durationMs');
	});

	test('a real upstream 429 through a slot with room stays rate_limited, with a duration', async () => {
		await createEnrichmentEngine({
			plugins: [
				withSlot(
					async () => new Response('slow down', { status: 429, headers: { 'retry-after': '3' } }),
					createRequestSlot({ minSpacingMs: 0, maxQueue: 0 })
				),
			],
		}).enrich(urlRequest());
		expect(tuples()).toEqual([wikipedia('summary', 'error', 'rate_limited')]);
		expect(typeof requests()[0]?.durationMs).toBe('number');
	});
});
