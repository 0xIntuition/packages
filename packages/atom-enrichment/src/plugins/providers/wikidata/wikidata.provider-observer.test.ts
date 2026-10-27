import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import {
	addProviderObserver,
	type ProviderEvent,
	type ProviderRequestEvent,
	resetProviderObserversForTests,
} from '@0xintuition/pipeline-runtime/provider-observer';
import {
	createRequestSlot,
	getProcessRequestSlot,
	RequestSlotRejectedError,
	resetProcessRequestSlotsForTests,
} from '@0xintuition/pipeline-runtime/request-slot';
import {
	createHeldRequestSlot,
	createRefusingAfterSlot,
} from '@0xintuition/pipeline-runtime/testing/held-request-slot';
import { createMemoryCacheAdapter } from '../../../cache';
import { createEnrichmentEngine } from '../../../engine';
import {
	createMockAtomInput,
	createMockPluginContext,
	createMockRequest,
	useStubbedPublicDns,
} from '../../../testing';
import { createPinAwareFetch, type FetchLike } from '../__shared__/http';
import { getWikimediaRequestSlot, WIKIMEDIA_USER_AGENT } from '../__shared__/provider-fetch';
import { createWikipediaPlugin } from '../wikipedia';
import entityFixture from './__fixtures__/entity.json';
import { createWikidataPlugin } from './index';

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
const tuple = (
	operation: ProviderRequestEvent['operation'],
	outcome: ProviderRequestEvent['outcome'],
	reason: ProviderRequestEvent['reason'] = 'none'
) => ({ provider: 'wikidata' as const, operation, outcome, reason, source: 'live' as const });

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

const ENTITY = entityFixture.entities.Q12345;
const entityResponse = (id = 'Q12345') => Response.json({ entities: { [id]: { ...ENTITY, id } } });
const humanResponse = (id: string) =>
	Response.json({
		entities: {
			[id]: {
				...ENTITY,
				id,
				claims: {
					P31: [
						{
							mainsnak: {
								snaktype: 'value',
								property: 'P31',
								datavalue: { value: { id: 'Q5' }, type: 'wikibase-entityid' },
							},
						},
					],
				},
			},
		},
	});
const searchResponse = (...ids: string[]) =>
	Response.json({ searchinfo: { search: 'x' }, search: ids.map((id) => ({ id })), success: 1 });

function plugin(fetch: FetchLike) {
	return createWikidataPlugin({
		fetch: createPinAwareFetch(fetch),
		requestSlot: createRequestSlot({ minSpacingMs: 0 }),
	});
}

const qidRequest = () =>
	createMockRequest({
		input: createMockAtomInput({ hints: { identifiers: { wikidata: 'Q12345' } } }),
	});
const titleRequest = () =>
	createMockRequest({
		input: createMockAtomInput({ hints: { name: 'Acme Labs' } }),
	});

describe('Wikidata request observer: entity', () => {
	test('a 200 records exactly one entity hit with a duration, and sends the Wikimedia User-Agent', async () => {
		const seen: Array<{ url: string; headers: Headers }> = [];
		const result = await createEnrichmentEngine({
			plugins: [
				plugin(async (url, init) => {
					seen.push({ url, headers: new Headers(init?.headers) });
					return entityResponse();
				}),
			],
		}).enrich(qidRequest());
		expect(result.artifacts).toHaveLength(1);
		expect(tuples()).toEqual([tuple('entity', 'hit')]);
		expect(typeof requests()[0]?.durationMs).toBe('number');
		expect(seen).toHaveLength(1);
		expect(seen[0]?.headers.get('user-agent')).toBe(WIKIMEDIA_USER_AGENT);
	});

	test('a 404 (no such entity) is a miss in the metric and no error in the engine', async () => {
		const result = await createEnrichmentEngine({
			plugins: [plugin(async () => new Response('<html>Not Found</html>', { status: 404 }))],
		}).enrich(qidRequest());
		expect(tuples()).toEqual([tuple('entity', 'miss')]);
		expect(result.errors).toEqual([]);
		expect(result.artifacts).toEqual([]);
		expect(result.status).toBe('success');
	});

	test('a 200 without the requested entity is a miss', async () => {
		await createEnrichmentEngine({
			plugins: [plugin(async () => Response.json({ entities: {} }))],
		}).enrich(qidRequest());
		expect(tuples()).toEqual([tuple('entity', 'miss')]);
	});

	test('429 is rate_limited with Retry-After in the engine error, 403 is auth_failed, 500 is upstream_5xx', async () => {
		const limited = await createEnrichmentEngine({
			plugins: [
				plugin(async () => new Response('', { status: 429, headers: { 'retry-after': '12' } })),
			],
		}).enrich(qidRequest());
		expect(limited.errors).toMatchObject([
			{
				pluginId: 'wikidata',
				code: 'rate_limited',
				retriable: true,
				details: { status: 429, retryAfterMs: 12_000 },
			},
		]);
		const refused = await createEnrichmentEngine({
			plugins: [plugin(async () => new Response('Please set a user-agent', { status: 403 }))],
		}).enrich(qidRequest());
		expect(refused.errors).toMatchObject([{ code: 'auth_failed' }]);
		await createEnrichmentEngine({
			plugins: [plugin(async () => new Response('', { status: 500 }))],
		}).enrich(qidRequest());
		expect(tuples()).toEqual([
			tuple('entity', 'error', 'rate_limited'),
			tuple('entity', 'error', 'auth_failed'),
			tuple('entity', 'error', 'upstream_5xx'),
		]);
	});

	test('an unparseable body is invalid_response', async () => {
		await createEnrichmentEngine({
			plugins: [plugin(async () => new Response('<html>', { status: 200 }))],
		}).enrich(qidRequest());
		expect(tuples()).toEqual([tuple('entity', 'error', 'invalid_response')]);
	});
});

describe('Wikidata request observer: search', () => {
	test('a title search records a search hit then an entity hit, with maxlag and the User-Agent', async () => {
		const seen: Array<{ url: string; ua: string | null }> = [];
		const result = await createEnrichmentEngine({
			plugins: [
				plugin(async (url, init) => {
					seen.push({ url, ua: new Headers(init?.headers).get('user-agent') });
					return url.includes('wbsearchentities') ? searchResponse('Q12345') : entityResponse();
				}),
			],
		}).enrich(titleRequest());
		expect(result.artifacts).toHaveLength(1);
		expect(tuples()).toEqual([tuple('search', 'hit'), tuple('entity', 'hit')]);
		expect(seen).toHaveLength(2);
		const search = new URL(seen[0]?.url ?? '');
		expect(search.searchParams.get('maxlag')).toBe('5');
		expect(search.searchParams.get('action')).toBe('wbsearchentities');
		// EntityData ignores maxlag (live check); only the action API gets it.
		expect(seen[1]?.url).toContain('Special:EntityData/Q12345.json');
		expect(seen[1]?.url).not.toContain('maxlag');
		for (const call of seen) expect(call.ua).toBe(WIKIMEDIA_USER_AGENT);
	});

	test('an empty search is a miss, with no entity request and no engine error', async () => {
		let dials = 0;
		const result = await createEnrichmentEngine({
			plugins: [
				plugin(async () => {
					dials += 1;
					return searchResponse();
				}),
			],
		}).enrich(titleRequest());
		expect(dials).toBe(1);
		expect(tuples()).toEqual([tuple('search', 'miss')]);
		expect(result.errors).toEqual([]);
		expect(result.artifacts).toEqual([]);
	});

	test('a 200 whose body is a maxlag error is rate_limited with Retry-After, never an empty result', async () => {
		const result = await createEnrichmentEngine({
			plugins: [
				plugin(
					async () =>
						new Response(
							JSON.stringify({ error: { code: 'maxlag', info: 'Waiting for a database server' } }),
							{
								status: 200,
								headers: {
									'retry-after': '5',
									'mediawiki-api-error': 'maxlag',
									'content-type': 'application/json',
								},
							}
						)
				),
			],
		}).enrich(titleRequest());
		expect(tuples()).toEqual([tuple('search', 'error', 'rate_limited')]);
		expect(result.errors).toMatchObject([
			{
				pluginId: 'wikidata',
				code: 'rate_limited',
				retriable: true,
				details: { status: 429, retryAfterMs: 5_000 },
			},
		]);
	});

	test.each<[string, ProviderRequestEvent['reason'], string]>([
		['ratelimited', 'rate_limited', 'rate_limited'],
		['internal_api_error_DBQueryError', 'upstream_5xx', 'upstream_error'],
		['readonly', 'upstream_5xx', 'upstream_error'],
		['badvalue', 'invalid_response', 'upstream_error'],
	])('a 200 flagged mediawiki-api-error %s is %s (header, then the same body without the header), never an empty result', async (code, reason, engineCode) => {
		for (const headers of [
			{ 'mediawiki-api-error': code, 'retry-after': '7' },
			{} as Record<string, string>,
		]) {
			events = [];
			const dialled: string[] = [];
			const result = await createEnrichmentEngine({
				plugins: [
					plugin(async (url) => {
						dialled.push(url);
						return Response.json({ error: { code } }, { headers });
					}),
				],
			}).enrich(titleRequest());
			expect(tuples()).toEqual([tuple('search', 'error', reason)]);
			expect(result.errors).toMatchObject([{ pluginId: 'wikidata', code: engineCode }]);
			// A failed search ends the run (no candidate is fetched); a throttle also carries retryAfterMs.
			expect(dialled).toHaveLength(1);
			if (reason === 'rate_limited' && 'retry-after' in headers) {
				expect(result.errors).toMatchObject([{ details: { retryAfterMs: 7_000 } }]);
			}
			expect(result.artifacts).toEqual([]);
		}
	});

	test('a search that answers 404 is a miss in the metric AND an empty run, never a failed one', async () => {
		let dials = 0;
		const result = await createEnrichmentEngine({
			plugins: [
				plugin(async () => {
					dials += 1;
					return new Response('', { status: 404 });
				}),
			],
		}).enrich(titleRequest());
		expect(dials).toBe(1);
		expect(tuples()).toEqual([tuple('search', 'miss')]);
		expect(result.errors).toEqual([]);
		expect(result.artifacts).toEqual([]);
		expect(result.status).toBe('success');
	});

	test('a candidate whose EntityData fails is recorded, and the next candidate still wins', async () => {
		const result = await createEnrichmentEngine({
			plugins: [
				plugin(async (url) => {
					if (url.includes('wbsearchentities')) return searchResponse('Q1', 'Q12345');
					return url.includes('Q1.json') ? new Response('', { status: 500 }) : entityResponse();
				}),
			],
		}).enrich(titleRequest());
		expect(result.artifacts).toHaveLength(1);
		expect(tuples()).toEqual([
			tuple('search', 'hit'),
			tuple('entity', 'error', 'upstream_5xx'),
			tuple('entity', 'hit'),
		]);
	});

	test('a candidate that is a 404 is a recorded miss, not an error', async () => {
		const result = await createEnrichmentEngine({
			plugins: [
				plugin(async (url) => {
					if (url.includes('wbsearchentities')) return searchResponse('Q1', 'Q12345');
					return url.includes('Q1.json') ? new Response('', { status: 404 }) : entityResponse();
				}),
			],
		}).enrich(titleRequest());
		expect(result.errors).toEqual([]);
		expect(result.artifacts).toHaveLength(1);
		expect(tuples()).toEqual([
			tuple('search', 'hit'),
			tuple('entity', 'miss'),
			tuple('entity', 'hit'),
		]);
	});
});

describe('Wikidata candidate loop failure branches', () => {
	const candidates =
		(...responses: Record<string, () => Response>[]) =>
		async (url: string) => {
			if (url.includes('wbsearchentities')) return searchResponse('Q1', 'Q2');
			for (const table of responses) {
				for (const [id, respond] of Object.entries(table)) {
					if (url.includes(`/${id}.json`)) return respond();
				}
			}
			return entityResponse();
		};

	test('every candidate failing records each failure once and fails the run', async () => {
		const result = await createEnrichmentEngine({
			plugins: [
				plugin(
					candidates({
						Q1: () => new Response('', { status: 500 }),
						Q2: () => new Response('', { status: 500 }),
					})
				),
			],
		}).enrich(titleRequest());
		expect(tuples()).toEqual([
			tuple('search', 'hit'),
			tuple('entity', 'error', 'upstream_5xx'),
			tuple('entity', 'error', 'upstream_5xx'),
		]);
		expect(result.errors).toMatchObject([{ pluginId: 'wikidata', code: 'upstream_error' }]);
		expect(result.errors).toHaveLength(1);
		expect(result.artifacts).toEqual([]);
	});

	test('a 404 candidate plus a 500 candidate is an empty, error-free run (the 404 was a real answer)', async () => {
		const result = await createEnrichmentEngine({
			plugins: [
				plugin(
					candidates({
						Q1: () => new Response('', { status: 404 }),
						Q2: () => new Response('', { status: 500 }),
					})
				),
			],
		}).enrich(titleRequest());
		expect(tuples()).toEqual([
			tuple('search', 'hit'),
			tuple('entity', 'miss'),
			tuple('entity', 'error', 'upstream_5xx'),
		]);
		expect(result.errors).toEqual([]);
		expect(result.artifacts).toEqual([]);
	});

	test('a 429 on a candidate stops the loop: no further candidate is fetched and the engine sees rate_limited with Retry-After', async () => {
		const dialled: string[] = [];
		const result = await createEnrichmentEngine({
			plugins: [
				plugin(async (url) => {
					dialled.push(url);
					return candidates({
						Q1: () => new Response('', { status: 429, headers: { 'retry-after': '5' } }),
					})(url);
				}),
			],
		}).enrich(titleRequest());
		expect(tuples()).toEqual([tuple('search', 'hit'), tuple('entity', 'error', 'rate_limited')]);
		expect(dialled.some((url) => url.includes('/Q2.json'))).toBe(false);
		expect(result.errors).toMatchObject([
			{
				pluginId: 'wikidata',
				code: 'rate_limited',
				retriable: true,
				details: { retryAfterMs: 5_000 },
			},
		]);
		expect(result.artifacts).toEqual([]);
	});

	test('a 429 after a usable candidate keeps that candidate and stops calling Wikimedia', async () => {
		const dialled: string[] = [];
		const result = await createEnrichmentEngine({
			plugins: [
				plugin(async (url) => {
					dialled.push(url);
					if (url.includes('wbsearchentities')) return searchResponse('Q1', 'Q2', 'Q3');
					if (url.includes('/Q2.json')) {
						return new Response('', { status: 429, headers: { 'retry-after': '5' } });
					}
					return entityResponse(/\/(Q\d+)\.json/.exec(url)?.[1]);
				}),
			],
		}).enrich(titleRequest());
		expect(tuples()).toEqual([
			tuple('search', 'hit'),
			tuple('entity', 'hit'),
			tuple('entity', 'error', 'rate_limited'),
		]);
		expect(dialled.some((url) => url.includes('/Q3.json'))).toBe(false);
		expect(result.errors).toEqual([]);
		expect(result.artifacts).toHaveLength(1);
		expect(result.artifacts[0]?.meta).toMatchObject({ identityStrength: 'title' });
	});
});

describe('Wikidata pacing', () => {
	const elapsed = (starts: number[]) => starts[1]! - starts[0]!;

	test('two plugin instances share the process slot "wikidata" (250 ms apart on the real clock)', async () => {
		const starts: number[] = [];
		const make = () =>
			createWikidataPlugin({
				fetch: createPinAwareFetch(async () => {
					starts.push(performance.now());
					return entityResponse();
				}),
			});
		await Promise.all([
			createEnrichmentEngine({ plugins: [make()] }).enrich(qidRequest()),
			createEnrichmentEngine({ plugins: [make()] }).enrich(qidRequest()),
		]);
		expect(starts).toHaveLength(2);
		expect(elapsed(starts)).toBeGreaterThanOrEqual(240);
	});

	test('the process slot is the one getWikimediaRequestSlot() hands out, and a hand-spelled pacing is refused', () => {
		expect(getWikimediaRequestSlot()).toBe(getWikimediaRequestSlot());
		// Lane 2's identity bridge must take the slot from the accessor: any other spelling of the
		// pacing (here: no maxQueue) is a different pacing for the same key and throws.
		expect(() => getProcessRequestSlot('wikidata', { minSpacingMs: 250 })).toThrow(
			/different pacing/
		);
	});

	test('a client built with a private slot leaves the process slot unregistered', async () => {
		await createEnrichmentEngine({ plugins: [plugin(async () => entityResponse())] }).enrich(
			qidRequest()
		);
		// Unregistered: any pacing may now be registered for the key without a mismatch.
		expect(() => getProcessRequestSlot('wikidata', { minSpacingMs: 17 })).not.toThrow();
	});

	test('a search and its candidate fetches are paced one after another, through the engine', async () => {
		const starts: number[] = [];
		const result = await createEnrichmentEngine({
			plugins: [
				createWikidataPlugin({
					fetch: createPinAwareFetch(async (url: string) => {
						starts.push(performance.now());
						return url.includes('wbsearchentities') ? searchResponse('Q12345') : entityResponse();
					}),
				}),
			],
		}).enrich(titleRequest());
		expect(result.artifacts).toHaveLength(1);
		expect(starts).toHaveLength(2);
		expect(elapsed(starts)).toBeGreaterThanOrEqual(240);
	});

	test('a Wikipedia summary and a Wikidata search share the one slot (at least 240 ms apart)', async () => {
		const starts: number[] = [];
		const stub = createPinAwareFetch(async (url: string) => {
			starts.push(performance.now());
			if (url.includes('/page/summary/')) {
				return Response.json({ title: 'Acme Labs', extract: 'x', pageid: 1 });
			}
			return url.includes('wbsearchentities') ? searchResponse() : entityResponse();
		});
		const wikipediaUrl = createMockRequest({
			input: createMockAtomInput({
				hints: { name: 'Acme Labs', url: 'https://en.wikipedia.org/wiki/Acme_Labs' },
			}),
		});
		await Promise.all([
			createEnrichmentEngine({ plugins: [createWikipediaPlugin({ fetch: stub })] }).enrich(
				wikipediaUrl
			),
			createEnrichmentEngine({ plugins: [createWikidataPlugin({ fetch: stub })] }).enrich(
				titleRequest()
			),
		]);
		expect(starts).toHaveLength(2);
		expect(elapsed(starts)).toBeGreaterThanOrEqual(240);
	});
});

describe('Wikidata cancellation', () => {
	const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

	test('the engine deadline during a hung request records exactly one timeout', async () => {
		const result = await createEnrichmentEngine({
			plugins: [plugin(() => new Promise<Response>(() => {}))],
		}).enrich({ ...qidRequest(), timeoutMs: 40 });
		expect(result.errors.map((error) => error.code)).toEqual(['timeout']);
		await sleep(20);
		expect(tuples()).toEqual([tuple('entity', 'error', 'timeout')]);
	});

	test('a caller cancelling mid-request records nothing', async () => {
		const external = new AbortController();
		const pending = createEnrichmentEngine({
			plugins: [plugin(() => new Promise<Response>(() => {}))],
		})
			.enrich({ ...qidRequest(), timeoutMs: 5_000 }, { signal: external.signal })
			.catch((error: unknown) => error);
		await sleep(30);
		external.abort(new Error('user left'));
		await pending;
		await sleep(20);
		expect(tuples()).toEqual([]);
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

describe('Wikidata engine cache observation', () => {
	test('entity: a second run served from the artifact cache records one source=cache hit and no dial', async () => {
		let dials = 0;
		const engine = createEnrichmentEngine({
			cache: createMemoryCacheAdapter(),
			plugins: [
				plugin(async () => {
					dials += 1;
					return entityResponse();
				}),
			],
		});
		await engine.enrich(qidRequest());
		const second = await engine.enrich(qidRequest());
		expect(dials).toBe(1);
		expect(second.timings.cacheHits).toBe(1);
		expect(tuples()).toEqual([
			tuple('entity', 'hit'),
			{ ...tuple('entity', 'hit'), source: 'cache' },
		]);
	});

	test('search: a cached title-only run records one source=cache hit for search, not entity', async () => {
		const engine = createEnrichmentEngine({
			cache: createMemoryCacheAdapter(),
			plugins: [
				plugin(async (url) =>
					url.includes('wbsearchentities') ? searchResponse('Q12345') : entityResponse()
				),
			],
		});
		await engine.enrich(titleRequest());
		await engine.enrich(titleRequest());
		expect(tuples()).toEqual([
			tuple('search', 'hit'),
			tuple('entity', 'hit'),
			{ ...tuple('search', 'hit'), source: 'cache' },
		]);
	});

	test('a cached empty run records exactly one source=cache miss and no second request', async () => {
		let dials = 0;
		const engine = createEnrichmentEngine({
			cache: createMemoryCacheAdapter(),
			plugins: [
				plugin(async () => {
					dials += 1;
					return searchResponse();
				}),
			],
		});
		await engine.enrich(titleRequest());
		const second = await engine.enrich(titleRequest());
		expect(dials).toBe(1);
		expect(second.timings.cacheHits).toBe(1);
		expect(tuples()).toEqual([
			tuple('search', 'miss'),
			{ ...tuple('search', 'miss'), source: 'cache' },
		]);
	});

	test('a request Wikidata does not support declares no cache operation', () => {
		const instance = createWikidataPlugin();
		expect(instance.observability?.cacheOperations(nameless())).toEqual([]);
		expect(instance.observability?.cacheOperations(qidRequest())).toEqual(['entity']);
		expect(instance.observability?.cacheOperations(titleRequest())).toEqual(['search']);
	});
});

describe('Wikidata pacing-slot refusals are budget_exhausted, a real throttle stays rate_limited (ENG-17085)', () => {
	const heldSlot = createHeldRequestSlot;
	const withSlot = (fetch: FetchLike, requestSlot: ReturnType<typeof createRequestSlot>) =>
		createWikidataPlugin({ fetch: createPinAwareFetch(fetch), requestSlot });

	test('a full slot queue is one budget_exhausted without a duration or a request, not rate_limited', async () => {
		let dials = 0;
		const result = await createEnrichmentEngine({
			plugins: [
				withSlot(async () => {
					dials += 1;
					return entityResponse();
				}, heldSlot(0)),
			],
		}).enrich(qidRequest());
		expect(dials).toBe(0);
		expect(tuples()).toEqual([tuple('entity', 'budget_exhausted')]);
		expect(requests()[0]).not.toHaveProperty('durationMs');
		expect(result.artifacts).toEqual([]);
	});

	test('the same slot saturated: the title search is budget_exhausted too', async () => {
		await createEnrichmentEngine({
			plugins: [withSlot(async () => searchResponse('Q12345'), heldSlot(0))],
		}).enrich(titleRequest());
		expect(tuples()).toEqual([tuple('search', 'budget_exhausted')]);
	});

	test('the engine deadline while the request still waits for its turn is budget_exhausted, never a timeout', async () => {
		let dials = 0;
		await createEnrichmentEngine({
			plugins: [
				withSlot(async () => {
					dials += 1;
					return entityResponse();
				}, heldSlot()),
			],
		}).enrich({ ...qidRequest(), timeoutMs: 40 });
		await new Promise((resolve) => setTimeout(resolve, 30));
		expect(dials).toBe(0);
		expect(tuples()).toEqual([tuple('entity', 'budget_exhausted')]);
		expect(requests()[0]).not.toHaveProperty('durationMs');
	});

	test('a caller abort while it waits records nothing', async () => {
		const controller = new AbortController();
		const pending = withSlot(async () => entityResponse(), heldSlot())
			.enrich(
				qidRequest(),
				createMockPluginContext({ signal: controller.signal, deadlineAtMs: Date.now() + 60_000 })
			)
			.catch((error: unknown) => error);
		await new Promise((resolve) => setTimeout(resolve, 20));
		controller.abort(new Error('user left'));
		await pending;
		expect(tuples()).toEqual([]);
		// Control: the recorder is live. The same held slot, refused instead of cancelled, records one.
		await createEnrichmentEngine({
			plugins: [withSlot(async () => entityResponse(), heldSlot(0))],
		}).enrich(qidRequest());
		expect(tuples()).toEqual([tuple('entity', 'budget_exhausted')]);
	});

	test('one saturated enrichment records one entity budget_exhausted: the candidate loop stops at the refusal', async () => {
		const slot = createRefusingAfterSlot(1);
		let dials = 0;
		await createEnrichmentEngine({
			plugins: [
				withSlot(async () => {
					dials += 1;
					return searchResponse('Q1', 'Q2', 'Q3', 'Q4', 'Q5');
				}, slot),
			],
		}).enrich(titleRequest());
		expect(dials).toBe(1);
		expect(slot.runs).toBe(2);
		expect(tuples()).toEqual([tuple('search', 'hit'), tuple('entity', 'budget_exhausted')]);
		expect(requests()[1]).not.toHaveProperty('durationMs');
	});

	test('a refusal after a usable candidate keeps that candidate and stops fetching', async () => {
		const slot = createRefusingAfterSlot(2);
		const result = await createEnrichmentEngine({
			plugins: [
				withSlot(async (url) => {
					const text = String(url);
					return text.includes('wbsearchentities')
						? searchResponse('Q1', 'Q2', 'Q3')
						: entityResponse('Q1');
				}, slot),
			],
		}).enrich(titleRequest());
		expect(slot.runs).toBe(3);
		expect(tuples()).toEqual([
			tuple('search', 'hit'),
			tuple('entity', 'hit'),
			tuple('entity', 'budget_exhausted'),
		]);
		expect(result.artifacts.length).toBeGreaterThan(0);
	});

	test('a candidate that does not match, then a refusal: the plugin throws and the loop stops, and the run is retried later (ENG-17116)', async () => {
		const slot = createRefusingAfterSlot(2);
		const plugin = withSlot(async (url) => {
			return String(url).includes('wbsearchentities')
				? searchResponse('Q1', 'Q2', 'Q3')
				: humanResponse('Q1');
		}, slot);
		// Q1 is a human (Person); the atom is a recording, so the type disagrees and nothing is held.
		const mismatch = () =>
			createMockRequest({
				input: createMockAtomInput({
					hints: { name: 'Acme Labs' },
					jsonLd: {
						'@context': 'https://schema.org',
						'@type': 'MusicRecording',
						name: 'Acme Labs',
					},
				}),
			});
		await expect(plugin.enrich(mismatch(), createMockPluginContext())).rejects.toBeInstanceOf(
			RequestSlotRejectedError
		);
		expect(slot.runs).toBe(3);
		expect(tuples()).toEqual([
			tuple('search', 'hit'),
			tuple('entity', 'hit'),
			tuple('entity', 'budget_exhausted'),
		]);
		expect(requests()[2]).not.toHaveProperty('durationMs');
		// Through the engine: a retriable budget_exhausted refusal with a delay (ENG-17116); the loop
		// still stopped at the first refusal (slot.runs above), the error it rethrows is what changed.
		events = [];
		const result = await createEnrichmentEngine({
			plugins: [withSlot(async () => searchResponse('Q1', 'Q2', 'Q3'), createRefusingAfterSlot(1))],
		}).enrich(mismatch());
		expect(result.artifacts).toEqual([]);
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0]).toMatchObject({
			code: 'internal_error',
			retriable: true,
			details: { errorClass: 'budget_exhausted' },
		});
		expect(result.errors[0]?.details?.retryAfterMs).toBeGreaterThan(0);
	});

	test('a slot deadline timeout while queued stops the candidate loop too', async () => {
		const slot = createRefusingAfterSlot(1, 'deadline');
		await createEnrichmentEngine({
			plugins: [withSlot(async () => searchResponse('Q1', 'Q2', 'Q3', 'Q4', 'Q5'), slot)],
		}).enrich(titleRequest());
		expect(slot.runs).toBe(2);
		expect(tuples()).toEqual([tuple('search', 'hit'), tuple('entity', 'budget_exhausted')]);
		expect(requests()[1]).not.toHaveProperty('durationMs');
	});

	test('a real upstream 429 through a slot with room stays rate_limited with a duration', async () => {
		await createEnrichmentEngine({
			plugins: [
				withSlot(
					async () => new Response('slow down', { status: 429, headers: { 'retry-after': '3' } }),
					createRequestSlot({ minSpacingMs: 0, maxQueue: 0 })
				),
			],
		}).enrich(qidRequest());
		expect(tuples()).toEqual([tuple('entity', 'error', 'rate_limited')]);
		expect(typeof requests()[0]?.durationMs).toBe('number');
	});
});
