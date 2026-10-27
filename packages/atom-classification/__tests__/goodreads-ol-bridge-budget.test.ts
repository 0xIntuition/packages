import { afterEach, beforeEach, describe, expect, it, spyOn } from 'bun:test';
import {
	createClassificationEngine,
	createGoodreadsPlugin,
	createIsbnPlugin,
	createTypeProfilesPlugin,
} from '../src';
import { GOODREADS_OPENLIBRARY_LOOKUP_STATE } from '../src/plugins/goodreads/openlibrary-adapter';
import {
	HOST_FETCH_BUDGET_MS,
	resetDomainHtmlHostCircuitBreakersForTests,
} from '../src/plugins/shared/domain-html/fetch';
import * as lookup from '../src/plugins/shared/openlibrary-lookup';
import { PLATFORM_STAGE_MISS } from '../src/plugins/shared/platform';
import { resolvePublicTestHostname } from './helpers/public-dns';

/**
 * ENG-15814 / R-15814-1 retires the Goodreads-page-only permutations:
 * - page-evidence none/ambiguous/empty/failure cannot exist without a Goodreads page fetch;
 * - an ISBN lookup cannot win or lose in parallel because URL-only fallback is sequential id -> title;
 * - the 250ms ISBN admission threshold does not apply to the title route.
 * Their URL-only deadline, abort, ordering, and non-terminal timeout analogs remain below.
 */
const URL = 'https://www.goodreads.com/book/show/170448.Animal_Farm';
const ISBN = '9780451526342';
const WORK = 'openlibrary:work:OL1168007W';
const hit = () =>
	Response.json({ docs: [{ key: '/works/OL1168007W', title: 'Animal Farm' }], numFound: 1 });
const miss = () => Response.json({ docs: [] });

// A deterministic clock advances each due callback and drains promise continuations.
// No wall-clock waits or network are used by this suite.
function fakeClock() {
	let now = 1_000_000;
	let nextId = 0;
	const timers = new Map<number, { at: number; run: () => void }>();
	const dateSpy = spyOn(Date, 'now').mockImplementation(() => now);
	const timerSpy = spyOn(globalThis, 'setTimeout').mockImplementation(((
		run: () => void,
		delay = 0
	) => {
		const id = ++nextId;
		timers.set(id, { at: now + delay, run });
		return id;
	}) as typeof setTimeout);
	const clearSpy = spyOn(globalThis, 'clearTimeout').mockImplementation(((id: number) => {
		timers.delete(Number(id));
	}) as typeof clearTimeout);
	const flush = async () => {
		for (let index = 0; index < 150; index += 1) await Promise.resolve();
	};
	return {
		flush,
		get pendingCount() {
			return timers.size;
		},
		async advance(ms: number) {
			await flush();
			const target = now + ms;
			while (true) {
				const due = [...timers]
					.filter(([, timer]) => timer.at <= target)
					.sort((a, b) => a[1].at - b[1].at)[0];
				if (!due) break;
				now = due[1].at;
				timers.delete(due[0]);
				due[1].run();
				await flush();
			}
			now = target;
			await flush();
		},
		restore() {
			dateSpy.mockRestore();
			timerSpy.mockRestore();
			clearSpy.mockRestore();
		},
	};
}

function deferredFetch() {
	let resolve!: (response: Response) => void;
	let reject!: (reason: unknown) => void;
	let settled = false;
	let signal: AbortSignal | null | undefined;
	const promise = new Promise<Response>((yes, no) => {
		resolve = yes;
		reject = no;
	});
	return {
		get signal() {
			return signal;
		},
		get settled() {
			return settled;
		},
		resolve(response: Response) {
			settled = true;
			resolve(response);
		},
		fetch(init?: { signal?: AbortSignal | null }) {
			signal = init?.signal;
			const abort = () => {
				settled = true;
				reject(signal?.reason);
			};
			if (signal?.aborted) abort();
			else signal?.addEventListener('abort', abort, { once: true });
			return promise;
		},
	};
}

function fixture(
	options: {
		idResult?: 'hit' | 'miss';
		idStatus?: number;
		budgetMs?: number;
		composition?: 'custom' | 'disabled' | 'runtime' | 'domainHtml' | 'publicMetadata';
		delays?: { id: number; title: number };
	} = {}
) {
	const id = deferredFetch();
	const title = deferredFetch();
	let customCalls = 0;
	const queries: string[] = [];
	const timedFetch = (
		pending: ReturnType<typeof deferredFetch>,
		response: Response,
		delay: number | undefined,
		init?: { signal?: AbortSignal | null }
	) => {
		if (delay !== undefined) {
			const timer = setTimeout(() => pending.resolve(response), delay);
			init?.signal?.addEventListener('abort', () => clearTimeout(timer), { once: true });
		}
		return pending.fetch(init);
	};
	const engine = createClassificationEngine({
		runtime: 'server',
		onClassifierError: () => undefined,
		plugins: [
			createTypeProfilesPlugin(),
			createGoodreadsPlugin({
				useDefaultOpenGraphAdapter: options.composition !== 'disabled',
				...(options.composition && options.composition !== 'disabled'
					? {
							adapters: {
								[options.composition === 'custom'
									? 'openGraph'
									: options.composition === 'runtime'
										? 'oEmbed'
										: options.composition]: () => {
									customCalls += 1;
									return PLATFORM_STAGE_MISS;
								},
							},
						}
					: {}),
				openLibrary: {
					budgetMs: options.budgetMs,
					resolveHostname: resolvePublicTestHostname,
					fetch: (url, init) => {
						queries.push(url);
						if (url.includes('id_goodreads')) {
							return options.idStatus
								? Promise.resolve(new Response('', { status: options.idStatus }))
								: timedFetch(
										id,
										options.idResult === 'miss' ? miss() : hit(),
										options.delays?.id,
										init
									);
						}
						return timedFetch(title, hit(), options.delays?.title, init);
					},
				},
			}),
		],
	});
	return {
		id,
		title,
		get customCalls() {
			return customCalls;
		},
		queries,
		classify: (signal?: AbortSignal) =>
			engine.classify(
				{ input: URL, mode: 'server-only', classificationSessionId: 'bridge-budget' },
				{ signal }
			),
	};
}

let clock: ReturnType<typeof fakeClock>;
beforeEach(() => {
	resetDomainHtmlHostCircuitBreakersForTests();
	// Optional only so the complete red suite executes before the export exists.
	(
		lookup as Partial<typeof lookup> & { resetOpenLibraryLookupCacheForTests?: () => void }
	).resetOpenLibraryLookupCacheForTests?.();
	clock = fakeClock();
});
afterEach(() => clock.restore());

describe('ENG-15533 shared budget and in-flight bridge', () => {
	it('W1 defaults to 5000ms, accepts 2000ms, and removes only OL host pins', () => {
		expect(lookup.createOpenLibraryLookupDeadlineAtMs(100)).toBe(5100);
		expect(lookup.createOpenLibraryLookupDeadlineAtMs(100, 2000)).toBe(2100);
		expect(HOST_FETCH_BUDGET_MS.has('openlibrary.org')).toBe(false);
		expect(HOST_FETCH_BUDGET_MS.has('www.openlibrary.org')).toBe(false);
		expect(HOST_FETCH_BUDGET_MS.get('goodreads.com')).toBe(2000);
		expect(HOST_FETCH_BUDGET_MS.get('www.goodreads.com')).toBe(2000);
	});
	it('W2a resolves a 2.5s id hit through the URL-only domain API', async () => {
		const f = fixture();
		const result = f.classify();
		await clock.advance(2500);
		f.id.resolve(hit());
		const classification = await result;
		expect(classification.resolved?.atoms[0]).toMatchObject({
			canonicalId: WORK,
			source: 'goodreads-openlibrary',
			metadata: { fallbackStage: 'domain-api' },
		});
		expect(f.queries).toHaveLength(1);
		expect(f.id.settled).toBe(true);
		expect(f.title.signal).toBeUndefined();
	});
	it('W2b/c id miss starts title lookup within the same deadline and awaits its hit', async () => {
		const f = fixture();
		let settled = false;
		const pending = f.classify().then((result) => {
			settled = true;
			return result;
		});
		await clock.advance(1500);
		f.id.resolve(miss());
		await clock.flush();
		expect(f.title.signal?.aborted).toBe(false);
		expect(settled).toBe(false);
		f.title.resolve(hit());
		expect((await pending).resolved?.atoms[0]?.canonicalId).toBe(WORK);
		expect(settled).toBe(true);
		expect(f.id.settled && f.title.settled).toBe(true);
		expect(f.queries).toHaveLength(2);
		expect(clock.pendingCount).toBe(0);
	});
	it('F1 R3b runtime oEmbed composition publishes the URL-only title hit at 2.5s', async () => {
		const f = fixture({
			composition: 'runtime',
			idResult: 'miss',
			delays: { id: 900, title: 1600 },
		});
		const startedAt = Date.now();
		let settled = false;
		const pending = f.classify().then((result) => {
			settled = true;
			return result;
		});
		await clock.advance(2499);
		expect(settled).toBe(false);
		await clock.advance(1);
		expect(settled).toBe(true);
		expect((await pending).resolved?.atoms[0]).toMatchObject({
			canonicalId: WORK,
			source: 'goodreads-openlibrary',
			metadata: { fallbackStage: 'domain-api' },
		});
		expect(Date.now() - startedAt).toBe(2500);
		expect(f.customCalls).toBe(0);
		expect(f.queries.filter((url) => url.includes('id_goodreads'))).toHaveLength(1);
		expect(f.queries.filter((url) => url.includes('title=Animal+Farm'))).toHaveLength(1);
		expect(f.id.settled && f.title.settled).toBe(true);
		expect(clock.pendingCount).toBe(0);
	});
	it.each([
		'domainHtml',
		'publicMetadata',
	] as const)('F1 R3b executable %s stage waits for id and title misses', async (composition) => {
		const f = fixture({ composition });
		const pending = f.classify();
		await clock.advance(2500);
		expect(f.customCalls).toBe(0);
		f.id.resolve(miss());
		await clock.flush();
		expect(f.customCalls).toBe(0);
		f.title.resolve(miss());
		await pending;
		expect(f.customCalls).toBe(1);
		expect(f.id.settled && f.title.settled).toBe(true);
		expect(f.queries).toHaveLength(2);
		expect(clock.pendingCount).toBe(0);
	});
	it.each([
		'custom',
		'disabled',
	] as const)('F1 %s composition awaits a 2.5s domain-api hit without pending state', async (composition) => {
		const writes = spyOn(Map.prototype, 'set');
		try {
			const f = fixture({ composition });
			let settled = false;
			const pending = f.classify().then((result) => {
				settled = true;
				return result;
			});
			await clock.advance(2500);
			expect(settled).toBe(false);
			f.id.resolve(hit());
			const result = await pending;
			expect(result.resolved?.atoms[0]).toMatchObject({
				canonicalId: WORK,
				metadata: { fallbackStage: 'domain-api' },
			});
			expect(f.customCalls).toBe(0);
			expect(f.queries).toHaveLength(1);
			expect(
				writes.mock.calls.filter(
					([key, value]) => key === GOODREADS_OPENLIBRARY_LOOKUP_STATE && value.kind === 'pending'
				)
			).toHaveLength(0);
			expect(clock.pendingCount).toBe(0);
		} finally {
			writes.mockRestore();
		}
	});
	it.each([
		'miss',
		'timeout',
	] as const)('F1 alternate composition drains %s before generic fallback', async (outcome) => {
		const writes = spyOn(Map.prototype, 'set');
		try {
			const f = fixture({ composition: outcome === 'miss' ? 'disabled' : 'custom' });
			const pending = f.classify();
			await clock.advance(outcome === 'miss' ? 2500 : 5000);
			if (outcome === 'miss') {
				f.id.resolve(miss());
				await clock.flush();
				f.title.resolve(miss());
			}
			const result = await pending;
			expect(result.status).toBe('complete');
			expect(result.resolved?.atoms[0]).toMatchObject({
				canonicalId: 'goodreads:book:170448',
				metadata: { fallbackStage: 'generic' },
			});
			if (outcome === 'timeout') {
				expect(
					result.resolverErrors?.some((error) => error.message.includes('domain-api:timeout'))
				).toBe(true);
				expect(f.id.signal?.aborted).toBe(true);
			}
			expect(f.id.settled).toBe(true);
			if (outcome === 'miss') expect(f.title.settled).toBe(true);
			expect(
				writes.mock.calls.filter(
					([key, value]) => key === GOODREADS_OPENLIBRARY_LOOKUP_STATE && value.kind === 'pending'
				)
			).toHaveLength(0);
			expect(clock.pendingCount).toBe(0);
		} finally {
			writes.mockRestore();
		}
	});
	it('W2d the shared-budget id and title timeouts are non-terminal', async () => {
		const f = fixture();
		const pending = f.classify();
		await clock.advance(5000);
		const result = await pending;
		expect(result.resolved?.atoms[0]?.canonicalId).toBe('goodreads:book:170448');
		const messages = result.resolverErrors?.map((error) => error.message).join(' ');
		expect(messages).toContain('timeout');
		expect(result.status).toBe('complete');
		expect(f.queries).toHaveLength(1);
		expect(f.id.settled).toBe(true);
		expect(f.title.signal).toBeUndefined();
	});
	it('W2f HTTP 500 is non-terminal and still permits the title lookup', async () => {
		const f = fixture({ idStatus: 500 });
		const pending = f.classify();
		await clock.flush();
		f.title.resolve(hit());
		const result = await pending;
		expect(result.resolved?.atoms[0]?.canonicalId).toBe(WORK);
		expect(result.resolverErrors?.some((error) => error.message.includes('http_error'))).toBe(true);
		expect(f.queries).toHaveLength(2);
	});
	it('W2g request abort settles both fetches and publishes no classification', async () => {
		const f = fixture();
		const controller = new AbortController();
		const pending = f.classify(controller.signal).then(
			() => 'published',
			() => 'aborted'
		);
		await clock.advance(1500);
		f.id.resolve(miss());
		await clock.flush();
		expect(f.title.signal?.aborted).toBe(false);
		controller.abort();
		expect(await pending).toBe('aborted');
		expect(f.title.signal?.aborted).toBe(true);
		expect(f.id.settled && f.title.settled).toBe(true);
		// F3a: on a request abort the engine's interruption wins the race and rejects before the
		// shared fetch helper's asynchronous cleanup clears its bounded deadline timers. Drain the
		// continuations without advancing time; nothing may stay armed after cleanup settles.
		await clock.advance(0);
		expect(clock.pendingCount).toBe(0);
	});
	it('W1 gives the title lookup the final 200ms of the shared deadline', async () => {
		const f = fixture();
		const pending = f.classify();
		await clock.advance(4800);
		f.id.resolve(miss());
		await clock.flush();
		expect(f.queries).toHaveLength(2);
		expect(f.title.signal?.aborted).toBe(false);
		await clock.advance(200);
		const result = await pending;
		expect(f.title.signal?.aborted).toBe(true);
		expect(result.resolved?.atoms[0]?.canonicalId).toBe('goodreads:book:170448');
		expect(result.status).toBe('complete');
		expect(result.resolverErrors?.some((error) => error.message.includes('timeout'))).toBe(true);
	});
});

describe('ENG-15533 lookup TTL cache and breaker', () => {
	function cachedFixture(response: () => Response = hit, cache?: false) {
		let calls = 0;
		const options = {
			cache,
			resolveHostname: resolvePublicTestHostname,
			fetch: async () => {
				calls += 1;
				return response();
			},
		};
		return {
			options,
			classify: () =>
				createClassificationEngine({
					runtime: 'server',
					onClassifierError: () => undefined,
					plugins: [
						createTypeProfilesPlugin(),
						createGoodreadsPlugin({ openLibrary: options, useDefaultOpenGraphAdapter: false }),
					],
				}).classify({ input: URL, mode: 'server-only', classificationSessionId: 'ttl' }),
			get calls() {
				return calls;
			},
			resolve: (value = '170448') =>
				lookup.resolveOpenLibraryWork({ kind: 'goodreads', value }, options),
		};
	}
	it('W3 a second classification uses zero OL fetches, including a fresh engine', async () => {
		const f = cachedFixture();
		for (let i = 0; i < 2; i += 1) {
			const engine = createClassificationEngine({
				runtime: 'server',
				onClassifierError: () => undefined,
				plugins: [
					createTypeProfilesPlugin(),
					createGoodreadsPlugin({ openLibrary: f.options, useDefaultOpenGraphAdapter: false }),
				],
			});
			expect(
				(
					await engine.classify({
						input: URL,
						mode: 'server-only',
						classificationSessionId: String(i),
					})
				).resolved?.atoms[0]?.canonicalId
			).toBe(WORK);
		}
		expect(f.calls).toBe(1);
	});
	it('W3 a cached hit ignores an expired budget', async () => {
		const f = cachedFixture();
		await f.classify();
		expect(
			(
				await lookup.resolveOpenLibraryWork(
					{ kind: 'goodreads', value: '170448' },
					{ ...f.options, deadlineAtMs: 0 }
				)
			).status
		).toBe('hit');
		expect(f.calls).toBe(1);
	});
	it.each([
		['hit', 86_400_000, WORK],
		['miss', 600_000, 'goodreads:book:170448'],
	] as const)('F2 %s TTL through three complete classifications', async (kind, ttl, canonicalId) => {
		const f = cachedFixture(kind === 'hit' ? hit : miss);
		const callsPerCycle = kind === 'hit' ? 1 : 2;
		const first = await f.classify();
		expect(first.status).toBe('complete');
		expect(first.resolved?.atoms[0]?.canonicalId).toBe(canonicalId);
		await clock.advance(ttl - 1);
		const second = await f.classify();
		expect(second.status).toBe('complete');
		expect(second.resolved?.atoms[0]?.canonicalId).toBe(canonicalId);
		expect(f.calls).toBe(callsPerCycle);
		await clock.advance(1);
		const third = await f.classify();
		expect(third.status).toBe('complete');
		expect(third.resolved?.atoms[0]?.canonicalId).toBe(canonicalId);
		expect(f.calls).toBe(callsPerCycle * 2);
	});
	it('F2 failures are never cached across complete classifications', async () => {
		const f = cachedFixture(() => new Response('', { status: 500 }));
		for (let index = 0; index < 2; index += 1) {
			const result = await f.classify();
			expect(result.status).toBe('complete');
			expect(result.resolved?.atoms[0]?.canonicalId).toBe('goodreads:book:170448');
			expect(result.resolverErrors?.length).toBeGreaterThan(0);
			resetDomainHtmlHostCircuitBreakersForTests();
		}
		expect(f.calls).toBe(4);
	});
	it('W3 cache:false bypasses reads and writes', async () => {
		const f = cachedFixture(hit, false);
		await f.resolve();
		await f.resolve();
		expect(f.calls).toBe(2);
		const cached = cachedFixture(miss);
		expect(await cached.resolve()).toEqual({ status: 'miss' });
		expect((await f.resolve()).status).toBe('hit');
		expect(f.calls).toBe(3);
	});
	it('W3 insertion-order eviction is bounded to 2048, reads do not refresh order', async () => {
		const f = cachedFixture();
		for (let i = 0; i < 2048; i += 1) await f.resolve(String(i));
		await f.resolve('0');
		expect(f.calls).toBe(2048);
		await f.resolve('2048');
		await f.resolve('1');
		expect(f.calls).toBe(2049);
		await f.resolve('0');
		expect(f.calls).toBe(2050);
	});
	it('F3 an older miss cannot overwrite a newer unexpired hit', async () => {
		const older = deferredFetch();
		const newer = deferredFetch();
		let calls = 0;
		const options = {
			resolveHostname: resolvePublicTestHostname,
			fetch: (_url: string, init?: { signal?: AbortSignal }) => {
				calls += 1;
				return (calls === 1 ? older : newer).fetch(init);
			},
		};
		const query = { kind: 'goodreads', value: '170448' } as const;
		const first = lookup.resolveOpenLibraryWork(query, options);
		await clock.flush();
		const second = lookup.resolveOpenLibraryWork(query, options);
		await clock.advance(100);
		newer.resolve(hit());
		expect((await second).status).toBe('hit');
		await clock.advance(3900);
		older.resolve(miss());
		expect((await first).status).toBe('miss');
		expect(await lookup.resolveOpenLibraryWork(query, options)).toMatchObject({
			status: 'hit',
			workKey: 'OL1168007W',
		});
		expect(calls).toBe(2);
		expect(clock.pendingCount).toBe(0);
	});
	it('W3 reset clears the cache', async () => {
		const f = cachedFixture();
		await f.resolve();
		const reset = (
			lookup as Partial<typeof lookup> & { resetOpenLibraryLookupCacheForTests?: () => void }
		).resetOpenLibraryLookupCacheForTests;
		expect(typeof reset).toBe('function');
		reset?.();
		await f.resolve();
		expect(f.calls).toBe(2);
	});
	it('W3 ISBN plugin shares normalized ISBN10/13 lookup cache', async () => {
		const f = cachedFixture();
		await lookup.resolveOpenLibraryWork({ kind: 'isbn', value: '0451526341' }, f.options);
		const engine = createClassificationEngine({
			runtime: 'server',
			onClassifierError: () => undefined,
			plugins: [createTypeProfilesPlugin(), createIsbnPlugin({ openLibrary: f.options })],
		});
		expect(
			(
				await engine.classify({
					input: ISBN,
					mode: 'server-only',
					classificationSessionId: 'isbn-cache',
				})
			).resolved?.atoms[0]?.canonicalId
		).toBe(WORK);
		expect(f.calls).toBe(1);
	});
	it('W4 budget timeouts still increment host failures; cached hits bypass an open breaker', async () => {
		const cached = cachedFixture();
		await cached.resolve();
		let calls = 0;
		const options = {
			cache: false as const,
			resolveHostname: resolvePublicTestHostname,
			fetch: (_url: string, init?: { signal?: AbortSignal }) => {
				calls += 1;
				return deferredFetch().fetch(init);
			},
		};
		for (let i = 0; i < 3; i += 1) {
			const pending = lookup.resolveOpenLibraryWork(
				{ kind: 'goodreads', value: 'timeout' },
				options
			);
			await clock.advance(5000);
			expect(await pending).toMatchObject({ status: 'failure', failure: { kind: 'timeout' } });
		}
		const blockedPromise = lookup.resolveOpenLibraryWork(
			{ kind: 'goodreads', value: 'timeout' },
			options
		);
		await clock.advance(5000);
		const blocked = await blockedPromise;
		expect(blocked).toMatchObject({
			status: 'failure',
			failure: { kind: 'circuit_open', circuit: { snapshot: { failures: 3 } } },
		});
		expect(calls).toBe(3);
		expect((await cached.resolve()).status).toBe('hit');
		expect(cached.calls).toBe(1);
	});
});
