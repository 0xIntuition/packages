import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';
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
import { createEnrichmentEngine } from '../../../engine';
import { createMockAtomInput, createMockPluginContext, createMockRequest } from '../../../testing';
import { createPinAwareFetch, type FetchLike } from '../__shared__/http';
import { createOpenLibraryPlugin as createProviderPlugin } from './index';

const fixture = async (name: string): Promise<unknown> =>
	await Bun.file(new URL(`./__fixtures__/${name}`, import.meta.url)).json();

function requestFor(url: string) {
	return createMockRequest({
		input: createMockAtomInput({
			hints: { url },
			jsonLd: { '@context': 'https://schema.org', '@type': 'Book', name: 'Book', url },
		}),
	});
}

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
	lookup: async () => [{ address: '93.184.216.34', family: 4 }],
}));

// The shared provider hop ignores a plain fetch and dials the pinned address itself, so
// every fixture fetch is marked pin-aware (ENG-16632).
function createOpenLibraryPlugin(options: Parameters<typeof createProviderPlugin>[0] = {}) {
	return createProviderPlugin({
		...options,
		...(options.fetch ? { fetch: createPinAwareFetch(options.fetch) } : {}),
	});
}

function plugin(fetch: FetchLike) {
	return createOpenLibraryPlugin({ fetch, maxAuthorFetches: 5, requestSpacingMs: 0 });
}

const WORK_URL = 'https://openlibrary.org/works/OL45804W';

describe('OpenLibrary enrichment observer', () => {
	test('work 200 with a cover records one work hit with a duration', async () => {
		const work = await fixture('work.json');
		const author = await fixture('author.json');
		await plugin(async (input) =>
			Response.json(String(input).includes('/authors/') ? author : work)
		).enrich(requestFor(WORK_URL), createMockPluginContext());
		// Exact list: the work, then one author hit per author the fixture references.
		expect(tuples()).toEqual([tuple('work', 'hit'), tuple('author', 'hit')]);
		expect(typeof requests()[0]?.durationMs).toBe('number');
	});

	test('work without a cover also records the editions fetch', async () => {
		const noCover = await fixture('work-without-cover.json');
		const editions = await fixture('editions-with-covers.json');
		await createOpenLibraryPlugin({
			fetch: async (input) =>
				Response.json(String(input).includes('/editions.json') ? editions : noCover),
			maxAuthorFetches: 0,
			requestSpacingMs: 0,
		}).enrich(requestFor(WORK_URL), createMockPluginContext());
		expect(tuples()).toEqual([tuple('work', 'hit'), tuple('editions', 'hit')]);
	});

	test('edition and isbn routes record book and isbn operations', async () => {
		const edition = await fixture('edition.json');
		const work = await fixture('work.json');
		const fetch: FetchLike = async (input) =>
			Response.json(String(input).includes('/works/') ? work : edition);
		const options = { fetch, maxAuthorFetches: 0, requestSpacingMs: 0 };
		await createOpenLibraryPlugin(options).enrich(
			requestFor('https://openlibrary.org/books/OL7353617M'),
			createMockPluginContext()
		);
		expect(tuples()).toEqual([tuple('book', 'hit'), tuple('work', 'hit')]);
		events = [];
		await createOpenLibraryPlugin(options).enrich(
			requestFor('https://openlibrary.org/isbn/9780140328721'),
			createMockPluginContext()
		);
		expect(tuples()).toEqual([tuple('isbn', 'hit'), tuple('work', 'hit')]);
	});

	test('404 is a miss, not an error', async () => {
		await expect(
			plugin(async () => new Response('{}', { status: 404 })).enrich(
				requestFor(WORK_URL),
				createMockPluginContext()
			)
		).rejects.toThrow();
		expect(tuples()).toEqual([tuple('work', 'miss')]);
	});

	test('429 is rate_limited', async () => {
		await plugin(async () => new Response('', { status: 429 }))
			.enrich(requestFor(WORK_URL), createMockPluginContext())
			.catch(() => undefined);
		expect(tuples()).toEqual([tuple('work', 'error', 'rate_limited')]);
	});

	test('503 is upstream_5xx and 403 is http_4xx', async () => {
		await plugin(async () => new Response('', { status: 503 }))
			.enrich(requestFor(WORK_URL), createMockPluginContext())
			.catch(() => undefined);
		await plugin(async () => new Response('', { status: 403 }))
			.enrich(requestFor(WORK_URL), createMockPluginContext())
			.catch(() => undefined);
		expect(tuples()).toEqual([
			tuple('work', 'error', 'upstream_5xx'),
			tuple('work', 'error', 'http_4xx'),
		]);
	});

	test('schema failure is invalid_response', async () => {
		await plugin(async () => Response.json(['not', 'an', 'object']))
			.enrich(requestFor(WORK_URL), createMockPluginContext())
			.catch(() => undefined);
		await plugin(async () => new Response('<html>', { status: 200 }))
			.enrich(requestFor(WORK_URL), createMockPluginContext())
			.catch(() => undefined);
		expect(tuples()).toEqual([
			tuple('work', 'error', 'invalid_response'),
			tuple('work', 'error', 'invalid_response'),
		]);
	});

	test('a thrown fetch is network', async () => {
		await plugin(async () => {
			throw new TypeError('connect ECONNREFUSED 10.0.0.1:443');
		})
			.enrich(requestFor(WORK_URL), createMockPluginContext())
			.catch(() => undefined);
		expect(tuples()).toEqual([tuple('work', 'error', 'network')]);
	});

	test('a thrown non-network error is other, not network', async () => {
		await plugin(async () => {
			throw new RangeError('programming bug');
		})
			.enrich(requestFor(WORK_URL), createMockPluginContext())
			.catch(() => undefined);
		expect(tuples()).toEqual([tuple('work', 'error', 'other')]);
	});

	test('a redirect without a location and an endless redirect loop are invalid_response', async () => {
		await plugin(async () => new Response('', { status: 302 }))
			.enrich(requestFor(WORK_URL), createMockPluginContext())
			.catch(() => undefined);
		await plugin(
			async () =>
				new Response('', { status: 302, headers: { location: 'https://openlibrary.org/loop' } })
		)
			.enrich(requestFor(WORK_URL), createMockPluginContext())
			.catch(() => undefined);
		expect(tuples()).toEqual([
			tuple('work', 'error', 'invalid_response'),
			tuple('work', 'error', 'invalid_response'),
		]);
	});

	test('a redirect to an embargoed host is blocked', async () => {
		await plugin(
			async () =>
				new Response('', { status: 302, headers: { location: 'https://www.imdb.com/title/tt0' } })
		)
			.enrich(requestFor(WORK_URL), createMockPluginContext())
			.catch(() => undefined);
		expect(tuples()).toEqual([tuple('work', 'error', 'blocked')]);
	});

	test('an author failure is observed even though the artifact degrades', async () => {
		const work = await fixture('work.json');
		const artifacts = await plugin(async (input) =>
			String(input).includes('/authors/') ? new Response('', { status: 500 }) : Response.json(work)
		).enrich(requestFor(WORK_URL), createMockPluginContext());
		expect(artifacts).toHaveLength(1);
		expect(tuples()).toEqual([tuple('work', 'hit'), tuple('author', 'error', 'upstream_5xx')]);
	});

	test('an abort at the engine deadline records a timeout even when fetch ignores the signal', async () => {
		const controller = new AbortController();
		const pending = plugin(() => new Promise<Response>(() => {})).enrich(
			requestFor(WORK_URL),
			createMockPluginContext({ signal: controller.signal, deadlineAtMs: Date.now() + 40 })
		);
		pending.catch(() => undefined);
		await new Promise((resolve) => setTimeout(resolve, 10));
		expect(events).toEqual([]);
		await new Promise((resolve) => setTimeout(resolve, 40));
		controller.abort(new Error('engine deadline'));
		await new Promise((resolve) => setTimeout(resolve, 10));
		expect(tuples()).toEqual([tuple('work', 'error', 'timeout')]);
	});

	test('the engine timeout of a hung OpenLibrary call is error/timeout', async () => {
		const engine = createEnrichmentEngine({
			plugins: [plugin(() => new Promise<Response>(() => {}))],
		});
		const result = await engine.enrich({
			...requestFor(WORK_URL),
			timeoutMs: 30,
		});
		expect(result.errors.map((error) => error.code)).toEqual(['timeout']);
		await new Promise((resolve) => setTimeout(resolve, 10));
		expect(tuples()).toEqual([tuple('work', 'error', 'timeout')]);
	});

	test('records exactly once per request when the signal aborts after completion', async () => {
		const controller = new AbortController();
		const work = await fixture('work.json');
		await createOpenLibraryPlugin({
			fetch: async () => Response.json(work),
			maxAuthorFetches: 0,
			requestSpacingMs: 0,
		}).enrich(requestFor(WORK_URL), createMockPluginContext({ signal: controller.signal }));
		controller.abort();
		expect(tuples()).toEqual([tuple('work', 'hit')]);
	});
});

describe('OpenLibrary enrichment observer: caller cancellation is not a provider timeout', () => {
	const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

	test('an external signal aborted before the engine deadline records no event (hung fetch)', async () => {
		const external = new AbortController();
		const engine = createEnrichmentEngine({
			plugins: [plugin(() => new Promise<Response>(() => {}))],
		});
		const pending = engine
			.enrich({ ...requestFor(WORK_URL), timeoutMs: 5000 }, { signal: external.signal })
			.catch((error: unknown) => error);
		await sleep(30);
		external.abort(new Error('user left'));
		await pending;
		await sleep(20);
		expect(tuples()).toEqual([]);
	});

	test('an external abort of a fetch that honours the signal records no event', async () => {
		const external = new AbortController();
		const engine = createEnrichmentEngine({
			plugins: [
				plugin(
					(_input, init) =>
						new Promise<Response>((_resolve, reject) => {
							init?.signal?.addEventListener('abort', () =>
								reject(new DOMException('aborted', 'AbortError'))
							);
						})
				),
			],
		});
		const pending = engine
			.enrich({ ...requestFor(WORK_URL), timeoutMs: 5000 }, { signal: external.signal })
			.catch((error: unknown) => error);
		await sleep(30);
		external.abort(new Error('worker shutdown'));
		await pending;
		await sleep(20);
		expect(tuples()).toEqual([]);
	});

	test('a request still waiting in the spacing queue when the caller aborts is not counted', async () => {
		const work = await fixture('work.json');
		const author = await fixture('author.json');
		const controller = new AbortController();
		const pending = createOpenLibraryPlugin({
			fetch: async (input) => {
				return Response.json(String(input).includes('/authors/') ? author : work);
			},
			maxAuthorFetches: 5,
			requestSpacingMs: 250,
		})
			.enrich(
				requestFor(WORK_URL),
				createMockPluginContext({ signal: controller.signal, deadlineAtMs: Date.now() + 60_000 })
			)
			.catch((error: unknown) => error);
		await sleep(80);
		controller.abort(new Error('user left'));
		await pending;
		await sleep(300);
		// Only the work request was sent and recorded; the queued author request never left.
		expect(tuples()).toEqual([tuple('work', 'hit')]);
	});

	test('the engine deadline still records exactly one timeout', async () => {
		const engine = createEnrichmentEngine({
			plugins: [plugin(() => new Promise<Response>(() => {}))],
		});
		await engine.enrich({ ...requestFor(WORK_URL), timeoutMs: 40 });
		await sleep(20);
		expect(tuples()).toEqual([tuple('work', 'error', 'timeout')]);
	});

	test('a signal that is already aborted before the request starts records nothing', async () => {
		const controller = new AbortController();
		controller.abort(new Error('already cancelled'));
		await plugin(async () => Response.json({}))
			.enrich(
				requestFor(WORK_URL),
				createMockPluginContext({ signal: controller.signal, deadlineAtMs: Date.now() - 1 })
			)
			.catch(() => undefined);
		expect(tuples()).toEqual([]);
	});
});

describe('OpenLibrary enrichment observer isolation', () => {
	test('artifacts are byte-identical observed, unobserved and with a throwing observer', async () => {
		const work = await fixture('work.json');
		const author = await fixture('author.json');
		const run = async () => {
			let calls = 0;
			const artifacts = await plugin(async (input) => {
				calls += 1;
				return Response.json(String(input).includes('/authors/') ? author : work);
			}).enrich(requestFor(WORK_URL), createMockPluginContext());
			return { calls, json: JSON.stringify(artifacts) };
		};
		const observed = await run();
		resetProviderObserversForTests();
		const bare = await run();
		addProviderObserver(() => {
			throw new Error('observer exploded');
		});
		const throwing = await run();
		expect(bare.json).toBe(observed.json);
		expect(throwing.json).toBe(observed.json);
		expect(bare.calls).toBe(observed.calls);
		expect(throwing.calls).toBe(observed.calls);
	});
});

describe('OpenLibrary transport codes (ENG-16976 behaviour change, pinned)', () => {
	// Before the shared classifier these codes were all `other`; they are now what they say.
	const thrower = (error: unknown) =>
		plugin(async () => {
			throw error;
		})
			.enrich(requestFor(WORK_URL), createMockPluginContext())
			.catch(() => undefined);

	test('ENOTFOUND, directly and as a cause, is network', async () => {
		await thrower(Object.assign(new Error('getaddrinfo'), { code: 'ENOTFOUND' }));
		await thrower(new Error('wrapped', { cause: { code: 'ENOTFOUND' } }));
		expect(tuples()).toEqual([
			tuple('work', 'error', 'network'),
			tuple('work', 'error', 'network'),
		]);
	});

	test('ECONNREFUSED, directly and as a cause, is network', async () => {
		await thrower(Object.assign(new Error('refused'), { code: 'ECONNREFUSED' }));
		await thrower(new Error('wrapped', { cause: { code: 'ECONNREFUSED' } }));
		expect(tuples()).toEqual([
			tuple('work', 'error', 'network'),
			tuple('work', 'error', 'network'),
		]);
	});

	test('a timeout code, directly and as a cause, is timeout', async () => {
		await thrower(Object.assign(new Error('slow'), { code: 'timeout' }));
		await thrower(new Error('wrapped', { cause: { code: 'timeout' } }));
		expect(tuples()).toEqual([
			tuple('work', 'error', 'timeout'),
			tuple('work', 'error', 'timeout'),
		]);
	});
});

describe('OpenLibrary request slot (ENG-16976)', () => {
	const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
	const answer = async (input: Parameters<FetchLike>[0]) =>
		Response.json(
			String(input).includes('/authors/')
				? await fixture('author.json')
				: await fixture('work.json')
		);

	test('a request our own spacing cannot fit before the engine deadline fails fast as budget_exhausted (not rate_limited)', async () => {
		const calls: string[] = [];
		await createOpenLibraryPlugin({
			fetch: async (input) => {
				calls.push(String(input));
				return await answer(input);
			},
			maxAuthorFetches: 1,
			requestSpacingMs: 400,
		}).enrich(requestFor(WORK_URL), createMockPluginContext({ deadlineAtMs: Date.now() + 120 }));
		// The author lookup degrades to an OLID reference; it was never dialled.
		expect(calls).toHaveLength(1);
		expect(tuples()).toEqual([tuple('work', 'hit'), tuple('author', 'budget_exhausted')]);
	});

	test('the engine deadline firing while the request waits for its turn is budget_exhausted and never dials', async () => {
		// Something else holds the only lane and never finishes.
		const requestSlot = createHeldRequestSlot();
		const controller = new AbortController();
		const calls: string[] = [];
		const pending = createOpenLibraryPlugin({
			fetch: async (input) => {
				calls.push(String(input));
				return await answer(input);
			},
			maxAuthorFetches: 0,
			requestSlot,
		})
			.enrich(
				requestFor(WORK_URL),
				createMockPluginContext({ signal: controller.signal, deadlineAtMs: Date.now() + 60 })
			)
			.catch((error: unknown) => error);
		await sleep(50);
		expect(events).toEqual([]);
		// What the engine does at its deadline.
		controller.abort(new Error('engine deadline'));
		await pending;
		expect(calls).toEqual([]);
		expect(tuples()).toEqual([tuple('work', 'budget_exhausted')]);
	});

	test('a caller cancel while the request waits for its turn records nothing and never dials', async () => {
		const requestSlot = createHeldRequestSlot();
		const controller = new AbortController();
		const calls: string[] = [];
		const pending = createOpenLibraryPlugin({
			fetch: async (input) => {
				calls.push(String(input));
				return await answer(input);
			},
			maxAuthorFetches: 0,
			requestSlot,
		})
			.enrich(
				requestFor(WORK_URL),
				createMockPluginContext({ signal: controller.signal, deadlineAtMs: Date.now() + 60_000 })
			)
			.catch((error: unknown) => error);
		await sleep(20);
		controller.abort(new Error('user left'));
		await pending;
		expect(calls).toEqual([]);
		expect(tuples()).toEqual([]);
	});

	test('a full slot queue is one work budget_exhausted without a duration or a dial, not rate_limited', async () => {
		const calls: string[] = [];
		await createOpenLibraryPlugin({
			fetch: async (input) => {
				calls.push(String(input));
				return await answer(input);
			},
			maxAuthorFetches: 0,
			requestSlot: createHeldRequestSlot(0),
		})
			.enrich(requestFor(WORK_URL), createMockPluginContext())
			.catch((error: unknown) => error);
		expect(calls).toEqual([]);
		expect(tuples()).toEqual([tuple('work', 'budget_exhausted')]);
		expect(requests()[0]).not.toHaveProperty('durationMs');
	});

	test('a real upstream 429 through a slot with room stays rate_limited, with a duration', async () => {
		await createOpenLibraryPlugin({
			fetch: async () =>
				new Response('slow down', { status: 429, headers: { 'retry-after': '3' } }),
			maxAuthorFetches: 0,
			requestSlot: createRequestSlot({ minSpacingMs: 0, maxQueue: 0 }),
		})
			.enrich(requestFor(WORK_URL), createMockPluginContext())
			.catch((error: unknown) => error);
		expect(tuples()).toEqual([tuple('work', 'error', 'rate_limited')]);
		expect(typeof requests()[0]?.durationMs).toBe('number');
	});

	test('two plugin instances pace through the one process-wide openlibrary slot', async () => {
		resetProcessRequestSlotsForTests();
		const work = await fixture('work.json');
		const starts: number[] = [];
		const make = () =>
			createProviderPlugin({
				fetch: createPinAwareFetch(async () => {
					starts.push(performance.now());
					return Response.json(work);
				}),
				maxAuthorFetches: 0,
			});
		await make().enrich(requestFor(WORK_URL), createMockPluginContext());
		await make().enrich(requestFor(WORK_URL), createMockPluginContext());
		resetProcessRequestSlotsForTests();
		expect(starts).toHaveLength(2);
		expect((starts[1] ?? 0) - (starts[0] ?? 0)).toBeGreaterThanOrEqual(300);
	});

	test('an injected slot replaces the process-wide one', async () => {
		const work = await fixture('work.json');
		let slotRuns = 0;
		const requestSlot = {
			run: async <T>(request: (signal: AbortSignal) => Promise<T>) => {
				slotRuns += 1;
				return await request(new AbortController().signal);
			},
		};
		await createOpenLibraryPlugin({
			fetch: async () => Response.json(work),
			maxAuthorFetches: 0,
			requestSlot,
		}).enrich(requestFor(WORK_URL), createMockPluginContext());
		expect(slotRuns).toBe(1);
		expect(tuples()).toEqual([tuple('work', 'hit')]);
	});
});
