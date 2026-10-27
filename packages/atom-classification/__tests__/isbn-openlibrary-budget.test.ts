import { afterEach, beforeEach, describe, expect, it, spyOn } from 'bun:test';
import { createClassificationEngine, createIsbnPlugin, createTypeProfilesPlugin } from '../src';
import { resetDomainHtmlHostCircuitBreakersForTests } from '../src/plugins/shared/domain-html/fetch';
import { resetOpenLibraryLookupCacheForTests } from '../src/plugins/shared/openlibrary-lookup';
import { resolvePublicTestHostname } from './helpers/public-dns';

const ISBN = '9780451526342';
const WORK = 'openlibrary:work:OL1168007W';

// Same deterministic clock as the Goodreads bridge suite; no wall-clock waits.
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

function fixture(options: { budgetMs?: number; disabled?: boolean } = {}) {
	const signals: AbortSignal[] = [];
	const abortedAt: number[] = [];
	const engine = createClassificationEngine({
		runtime: 'server',
		onClassifierError: () => undefined,
		plugins: [
			createTypeProfilesPlugin(),
			createIsbnPlugin({
				openLibrary: options.disabled
					? false
					: {
							budgetMs: options.budgetMs,
							resolveHostname: resolvePublicTestHostname,
							fetch: (_url, init) =>
								new Promise<Response>((resolve, reject) => {
									const signal = init?.signal;
									if (signal) signals.push(signal);
									const timer = setTimeout(
										() => resolve(Response.json({ docs: [{ key: '/works/OL1168007W' }] })),
										3000
									);
									signal?.addEventListener(
										'abort',
										() => {
											abortedAt.push(Date.now());
											clearTimeout(timer);
											reject(signal.reason);
										},
										{ once: true }
									);
								}),
						},
			}),
		],
	});
	return {
		signals,
		abortedAt,
		classify: (signal?: AbortSignal) =>
			engine.classify(
				{ input: ISBN, mode: 'server-only', classificationSessionId: 'isbn-budget' },
				{ signal }
			),
	};
}

let clock: ReturnType<typeof fakeClock>;
beforeEach(() => {
	resetDomainHtmlHostCircuitBreakersForTests();
	resetOpenLibraryLookupCacheForTests();
	clock = fakeClock();
});
afterEach(() => clock.restore());

describe('ENG-15533 standalone ISBN budget and cancellation', () => {
	it('F2a abort at 1.5s cancels the fetch and prevents a cache write', async () => {
		const f = fixture();
		const controller = new AbortController();
		const pending = f.classify(controller.signal).then(
			() => 'published',
			() => 'aborted'
		);
		await clock.advance(1500);
		controller.abort();
		expect(await pending).toBe('aborted');
		const fetchAborted = f.signals[0]?.aborted;
		// Pass the original answer time so an uncancelled lookup would poison the cache.
		await clock.advance(1500);
		const second = f.classify();
		await clock.flush();
		const fetchCount = f.signals.length;
		await clock.advance(3000);
		expect((await second).resolved?.atoms[0]?.canonicalId).toBe(WORK);
		expect(fetchAborted).toBe(true);
		expect(fetchCount).toBe(2);
		expect(clock.pendingCount).toBe(0);
	});
	it('F2b R1a default budget resolves a 3s answer to the OL work', async () => {
		const f = fixture();
		let settled = false;
		const pending = f.classify().then((result) => {
			settled = true;
			return result;
		});
		await clock.advance(2999);
		expect(settled).toBe(false);
		await clock.advance(1);
		expect((await pending).resolved?.atoms[0]?.canonicalId).toBe(WORK);
		expect(f.signals).toHaveLength(1);
		expect(clock.pendingCount).toBe(0);
	});
	it('F2c R1a explicit 2000ms budget aborts and returns the ISBN fallback with timeout', async () => {
		const f = fixture({ budgetMs: 2000 });
		const startedAt = Date.now();
		const pending = f.classify();
		await clock.advance(2000);
		const result = await pending;
		expect(result.resolved?.atoms[0]?.canonicalId).toBe(`isbn:${ISBN}`);
		expect(result.resolverErrors?.map((error) => error.message).join(' ')).toContain('timeout');
		expect(f.signals[0]?.aborted).toBe(true);
		expect(f.abortedAt).toEqual([startedAt + 2000]);
		expect(clock.pendingCount).toBe(0);
	});
	it('F2d openLibrary:false skips lookup', async () => {
		const fetchSpy = spyOn(globalThis, 'fetch').mockImplementation(
			Object.assign(
				() => {
					throw new Error('Disabled Open Library must not fetch');
				},
				{ preconnect: globalThis.fetch.preconnect }
			)
		);
		try {
			const f = fixture({ disabled: true });
			expect((await f.classify()).resolved?.atoms[0]?.canonicalId).toBe(`isbn:${ISBN}`);
			expect(fetchSpy).not.toHaveBeenCalled();
			expect(f.signals).toHaveLength(0);
			expect(clock.pendingCount).toBe(0);
		} finally {
			fetchSpy.mockRestore();
		}
	});
});
