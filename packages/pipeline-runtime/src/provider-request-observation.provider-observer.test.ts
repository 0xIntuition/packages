import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
	addProviderObserver,
	type ProviderOutcome,
	type ProviderReason,
	type ProviderRequestEvent,
	resetProviderObserversForTests,
} from './provider-observer';
import { lookupProviderOperation } from './provider-registry';
import {
	beginObservedRequest,
	isEngineDeadline,
	type ObservedRequestContext,
	observeProviderRequest,
	observeSlottedProviderRequest,
	type RequestOutcome,
} from './provider-request-observation';
import { createRequestSlot, RequestSlotRejectedError } from './request-slot';

let events: ProviderRequestEvent[];
beforeEach(() => {
	events = [];
	resetProviderObserversForTests();
	addProviderObserver((event) => {
		if (event.type === 'provider_request') events.push(event);
	});
});
afterEach(() => resetProviderObserversForTests());

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const classifyError = (): RequestOutcome => ({ outcome: 'error', reason: 'other' });
const base = { provider: 'openlibrary', operation: 'work' } as const;
const labels = () => events.map(({ outcome, reason, source }) => ({ outcome, reason, source }));
const live = (outcome: ProviderOutcome, reason: ProviderReason = 'none') => ({
	outcome,
	reason,
	source: 'live' as const,
});

describe('the (provider, operation) pairing is checked by the compiler', () => {
	it('rejects an operation that belongs to another provider', async () => {
		await observeProviderRequest(
			{
				provider: 'goodreads',
				// @ts-expect-error `work` is an OpenLibrary operation, not a Goodreads one
				operation: 'work',
				context: {},
				classifyError,
			},
			async () => 1
		);
		expect(
			beginObservedRequest({ provider: 'goodreads', operation: 'page', context: {} })
		).toBeDefined();
	});

	it('types event pairs: an event cannot name a goodreads work', () => {
		// @ts-expect-error a ProviderRequestEvent pairs the provider with its own operations
		const wrong: ProviderRequestEvent = {
			type: 'provider_request',
			provider: 'goodreads',
			operation: 'work',
			outcome: 'hit',
			reason: 'none',
			source: 'live',
		};
		expect(wrong.provider).toBe('goodreads');
	});
});

describe('beginObservedRequest', () => {
	it('records nothing for a signal that is already aborted', () => {
		const controller = new AbortController();
		controller.abort();
		expect(
			beginObservedRequest({ ...base, context: { signal: controller.signal } })
		).toBeUndefined();
		expect(events).toEqual([]);
	});

	it('records one event, once, with a duration', async () => {
		const observed = beginObservedRequest({ ...base, context: {} });
		await sleep(15);
		observed?.settle({ outcome: 'hit', reason: 'none' });
		observed?.settle({ outcome: 'error', reason: 'timeout' });
		observed?.fail(new Error('late'), classifyError);
		expect(labels()).toEqual([live('hit')]);
		expect(events[0]?.durationMs).toBeGreaterThanOrEqual(10);
	});

	it('measures the duration from `dialed`, not from `begin`', async () => {
		const observed = beginObservedRequest({ ...base, context: {} });
		await sleep(60);
		observed?.dialed();
		await sleep(5);
		observed?.settle({ outcome: 'hit', reason: 'none' });
		expect(events[0]?.durationMs).toBeLessThan(40);
	});

	it('a deadline reached while `queued` (our own pacing) records nothing; after `dialed` it is a timeout', () => {
		const deadlineAtMs = Date.now() - 1;
		const waiting = new AbortController();
		const queued = beginObservedRequest({
			...base,
			context: { signal: waiting.signal, deadlineAtMs },
		});
		queued?.queued();
		waiting.abort();
		queued?.fail(new Error('aborted'), classifyError);
		expect(events).toEqual([]);

		const dialing = new AbortController();
		const dialled = beginObservedRequest({
			...base,
			context: { signal: dialing.signal, deadlineAtMs },
		});
		dialled?.queued();
		dialled?.dialed();
		dialing.abort();
		expect(labels()).toEqual([live('error', 'timeout')]);
	});

	it('without `queued`, a deadline before `dialed` is still a timeout (slot-based providers)', () => {
		const controller = new AbortController();
		const observed = beginObservedRequest({
			...base,
			context: { signal: controller.signal, deadlineAtMs: Date.now() - 1 },
		});
		controller.abort();
		observed?.fail(new Error('aborted'), classifyError);
		expect(labels()).toEqual([live('error', 'timeout')]);
	});

	it('drop records nothing', () => {
		const observed = beginObservedRequest({ ...base, context: {} });
		observed?.drop();
		observed?.settle({ outcome: 'hit', reason: 'none' });
		expect(events).toEqual([]);
	});

	it('a caller cancel before the deadline records nothing; the deadline records a timeout once', async () => {
		const cancelled = new AbortController();
		const a = beginObservedRequest({
			...base,
			context: { signal: cancelled.signal, deadlineAtMs: Date.now() + 60_000 },
		});
		cancelled.abort();
		a?.fail(new Error('aborted'), classifyError);
		expect(events).toEqual([]);

		const deadline = new AbortController();
		const b = beginObservedRequest({
			...base,
			context: { signal: deadline.signal, deadlineAtMs: Date.now() + 10 },
		});
		await sleep(15);
		deadline.abort();
		b?.fail(new Error('aborted'), classifyError);
		expect(labels()).toEqual([live('error', 'timeout')]);
	});
});

describe('beginObservedRequest with source cache (a result another consumer fetched in the run)', () => {
	const page = { provider: 'goodreads', operation: 'page', source: 'cache' } as const;
	const cached = (outcome: ProviderOutcome) => ({
		outcome,
		reason: 'none' as const,
		source: 'cache' as const,
	});

	it('preconditions: the registry declares page hit/miss, work hit only, editions nothing', () => {
		expect(lookupProviderOperation('goodreads', 'page')?.cacheOutcomes).toEqual(['hit', 'miss']);
		expect(lookupProviderOperation('openlibrary', 'work')?.cacheOutcomes).toEqual(['hit']);
		expect(lookupProviderOperation('openlibrary', 'editions')?.cacheOutcomes).toEqual([]);
	});

	it('records a hit and a miss as source=cache, with no duration', () => {
		beginObservedRequest({ ...page, context: {} })?.settle({ outcome: 'hit', reason: 'none' });
		beginObservedRequest({ ...page, context: {} })?.settle({ outcome: 'miss', reason: 'none' });
		expect(labels()).toEqual([cached('hit'), cached('miss')]);
		expect(events.map((event) => event.durationMs)).toEqual([undefined, undefined]);
	});

	it('records nothing for an error: the fetch recorded it once, live', () => {
		const observed = beginObservedRequest({ ...page, context: {} });
		observed?.settle({ outcome: 'error', reason: 'blocked' });
		beginObservedRequest({ ...page, context: {} })?.fail(new Error('boom'), () => ({
			outcome: 'error',
			reason: 'other',
		}));
		expect(events).toEqual([]);
	});

	it('records nothing for an outcome the registry does not declare as cacheable', () => {
		// work is cached as a hit only; editions is never served from the cache.
		beginObservedRequest({
			provider: 'openlibrary',
			operation: 'work',
			source: 'cache',
			context: {},
		})?.settle({ outcome: 'miss', reason: 'none' });
		beginObservedRequest({
			provider: 'openlibrary',
			operation: 'editions',
			source: 'cache',
			context: {},
		})?.settle({ outcome: 'hit', reason: 'none' });
		expect(events).toEqual([]);
		beginObservedRequest({
			provider: 'openlibrary',
			operation: 'work',
			source: 'cache',
			context: {},
		})?.settle({ outcome: 'hit', reason: 'none' });
		expect(labels()).toEqual([cached('hit')]);
	});

	it('an engine deadline abort on a cache tracker records nothing (the fetch owns the timeout)', async () => {
		const controller = new AbortController();
		const observed = beginObservedRequest({
			...page,
			context: { signal: controller.signal, deadlineAtMs: Date.now() + 10 },
		});
		await sleep(15);
		controller.abort();
		observed?.fail(new Error('aborted'), classifyError);
		expect(events).toEqual([]);
	});

	it('observeProviderRequest and the slotted variant do not accept a source', async () => {
		await observeProviderRequest(
			{
				...base,
				// @ts-expect-error a request that dials is always live
				source: 'cache',
				context: {},
				classifyError,
			},
			async () => 1
		);
		await observeSlottedProviderRequest(
			{
				...base,
				// @ts-expect-error a request that dials is always live
				source: 'cache',
				context: {},
				classifyError,
			},
			createRequestSlot({ minSpacingMs: 0 }),
			async () => 1
		);
	});
});

describe('isEngineDeadline', () => {
	it('is true from 25 ms before the deadline, false without one', () => {
		expect(isEngineDeadline({})).toBe(false);
		expect(isEngineDeadline({ deadlineAtMs: Date.now() + 60_000 })).toBe(false);
		expect(isEngineDeadline({ deadlineAtMs: Date.now() + 10 })).toBe(true);
		expect(isEngineDeadline({ deadlineAtMs: Date.now() - 1 })).toBe(true);
	});
});

describe('observeProviderRequest', () => {
	it('records a resolved request as a hit by default', async () => {
		expect(
			await observeProviderRequest({ ...base, context: {}, classifyError }, async () => 7)
		).toBe(7);
		expect(labels()).toEqual([live('hit')]);
	});

	it('classifyResult turns a 200 with nothing in it into a miss', async () => {
		const search = (recordings: unknown[]) =>
			observeProviderRequest(
				{
					provider: 'openlibrary',
					operation: 'search_title',
					context: {},
					classifyError,
					classifyResult: (value: { recordings: unknown[] }) =>
						value.recordings.length > 0 ? 'hit' : 'miss',
				},
				async () => ({ recordings })
			);
		await search([]);
		await search([{}]);
		expect(labels()).toEqual([live('miss'), live('hit')]);
	});

	it('a throwing classifyResult never turns a good response into a failure', async () => {
		const value = await observeProviderRequest(
			{
				...base,
				context: {},
				classifyError,
				classifyResult: () => {
					throw new Error('bad classifier');
				},
			},
			async () => 'ok'
		);
		expect(value).toBe('ok');
		expect(labels()).toEqual([live('hit')]);
	});

	it('classifies a throw and rethrows the original error', async () => {
		const boom = new Error('boom');
		await expect(
			observeProviderRequest({ ...base, context: {}, classifyError }, async () => {
				throw boom;
			})
		).rejects.toBe(boom);
		expect(labels()).toEqual([live('error', 'other')]);
	});

	it('runs an already-cancelled request unobserved', async () => {
		const controller = new AbortController();
		controller.abort();
		let ran = false;
		await observeProviderRequest(
			{ ...base, context: { signal: controller.signal }, classifyError },
			async () => {
				ran = true;
			}
		);
		expect(ran).toBe(true);
		expect(events).toEqual([]);
	});

	it('records the engine deadline the moment the abort fires, even if the request never settles', async () => {
		const controller = new AbortController();
		const context: ObservedRequestContext = {
			signal: controller.signal,
			deadlineAtMs: Date.now() + 10,
		};
		observeProviderRequest(
			{ ...base, context, classifyError },
			() => new Promise<never>(() => {})
		).catch(() => undefined);
		await sleep(20);
		controller.abort();
		expect(labels()).toEqual([live('error', 'timeout')]);
	});
});

describe('observeSlottedProviderRequest', () => {
	const held = () => {
		const slot = createRequestSlot({ minSpacingMs: 0 });
		slot.run(() => new Promise<never>(() => {})).catch(() => undefined);
		return slot;
	};

	it('records a hit with the duration measured from the dial, not from the enqueue', async () => {
		const slot = createRequestSlot({ minSpacingMs: 80 });
		await slot.run(async () => undefined);
		await observeSlottedProviderRequest({ ...base, context: {}, classifyError }, slot, async () => {
			await sleep(5);
		});
		expect(labels()).toEqual([live('hit')]);
		// Waited ~80 ms for its turn; only the ~5 ms request counts.
		expect(events[0]?.durationMs).toBeLessThan(50);
	});

	it('a deadline that fires while the request waits is budget_exhausted (no duration) and never dials', async () => {
		const controller = new AbortController();
		let dialled = false;
		const pending = observeSlottedProviderRequest(
			{
				...base,
				context: { signal: controller.signal, deadlineAtMs: Date.now() + 40 },
				classifyError,
			},
			held(),
			async () => {
				dialled = true;
			}
		).catch((error: unknown) => error);
		await sleep(50);
		controller.abort(new Error('engine deadline'));
		await pending;
		expect(dialled).toBe(false);
		expect(labels()).toEqual([live('budget_exhausted')]);
		expect(events[0]).not.toHaveProperty('durationMs');
	});

	it("the slot's own deadline timer firing before the dial is budget_exhausted too, whichever timer fires first", async () => {
		// No signal: only the slot's timer can end the wait.
		const error = await observeSlottedProviderRequest(
			{ ...base, context: { deadlineAtMs: Date.now() + 30 }, classifyError },
			held(),
			async () => 1
		).catch((caught: unknown) => caught);
		expect((error as Error).name).toBe('TimeoutError');
		expect(labels()).toEqual([live('budget_exhausted')]);
		expect(events[0]).not.toHaveProperty('durationMs');
	});

	it('an overrun AFTER the dial stays a timeout, and a real upstream throttle stays rate_limited', async () => {
		const slot = createRequestSlot({ minSpacingMs: 0 });
		await observeSlottedProviderRequest(
			{ ...base, context: { deadlineAtMs: Date.now() + 20 }, classifyError },
			slot,
			() => new Promise<never>(() => {})
		).catch(() => undefined);
		await observeSlottedProviderRequest(
			{
				...base,
				context: {},
				classifyError: () => ({ outcome: 'error', reason: 'rate_limited' }),
			},
			slot,
			async () => {
				throw new Error('HTTP 429');
			}
		).catch(() => undefined);
		expect(labels()).toEqual([live('error', 'timeout'), live('error', 'rate_limited')]);
		// Measured from the dial to the deadline abort (~20 ms), not merely present.
		expect(events[0]?.durationMs).toBeGreaterThanOrEqual(10);
		expect(events[0]?.durationMs).toBeLessThan(1000);
		expect(typeof events[1]?.durationMs).toBe('number');
		expect(events[1]?.durationMs).toBeLessThan(1000);
	});

	it('the duration follows the dial, not the outcome: queued and never dialled has none, dialled has one', () => {
		const neverDialled = beginObservedRequest({ ...base, context: {} });
		neverDialled?.queued();
		neverDialled?.settle({ outcome: 'error', reason: 'other' });
		const dialled = beginObservedRequest({ ...base, context: {} });
		dialled?.queued();
		dialled?.dialed();
		dialled?.settle({ outcome: 'error', reason: 'other' });
		const direct = beginObservedRequest({ ...base, context: {} });
		direct?.settle({ outcome: 'hit', reason: 'none' });
		expect(events[0]).not.toHaveProperty('durationMs');
		expect(typeof events[1]?.durationMs).toBe('number');
		expect(typeof events[2]?.durationMs).toBe('number');
	});

	it('a caller cancel while the request waits records nothing and never dials', async () => {
		const controller = new AbortController();
		let dialled = false;
		const pending = observeSlottedProviderRequest(
			{
				...base,
				context: { signal: controller.signal, deadlineAtMs: Date.now() + 60_000 },
				classifyError,
			},
			held(),
			async () => {
				dialled = true;
			}
		).catch((error: unknown) => error);
		await sleep(10);
		controller.abort(new Error('user left'));
		await pending;
		expect(dialled).toBe(false);
		expect(events).toEqual([]);
	});

	it('a request our own pacing cannot fit before the deadline is budget_exhausted, not rate_limited or timeout', async () => {
		const slot = createRequestSlot({ minSpacingMs: 1000 });
		await slot.run(async () => undefined);
		let dialled = false;
		const error = await observeSlottedProviderRequest(
			{ ...base, context: { deadlineAtMs: Date.now() + 100 }, classifyError },
			slot,
			async () => {
				dialled = true;
			}
		).catch((caught: unknown) => caught);
		expect(error).toBeInstanceOf(RequestSlotRejectedError);
		expect(dialled).toBe(false);
		expect(labels()).toEqual([live('budget_exhausted')]);
		expect(events[0]).not.toHaveProperty('durationMs');
	});

	it('a fail-fast rejection after the engine deadline already passed is budget_exhausted too (nothing was dialled)', async () => {
		const slot = createRequestSlot({ minSpacingMs: 0 });
		const error = await observeSlottedProviderRequest(
			{ ...base, context: { deadlineAtMs: Date.now() - 5 }, classifyError },
			slot,
			async () => 1
		).catch((caught: unknown) => caught);
		expect((error as RequestSlotRejectedError).reason).toBe('deadline');
		expect(labels()).toEqual([live('budget_exhausted')]);
	});

	it('a full queue is budget_exhausted without a duration', async () => {
		const slot = createRequestSlot({ minSpacingMs: 0, maxQueue: 0 });
		slot.run(() => new Promise<never>(() => {})).catch(() => undefined);
		const error = await observeSlottedProviderRequest(
			{ ...base, context: {}, classifyError },
			slot,
			async () => 1
		).catch((caught: unknown) => caught);
		expect((error as RequestSlotRejectedError).reason).toBe('queue_full');
		expect(labels()).toEqual([live('budget_exhausted')]);
		expect(events[0]).not.toHaveProperty('durationMs');
	});

	it('the request gets the slot signal, so a hung fetch is aborted at the deadline', async () => {
		const slot = createRequestSlot({ minSpacingMs: 0 });
		let received: AbortSignal | undefined;
		const pending = observeSlottedProviderRequest(
			{ ...base, context: { deadlineAtMs: Date.now() + 5 }, classifyError },
			slot,
			(signal) => {
				received = signal;
				return new Promise<never>(() => {});
			}
		).catch((error: unknown) => error);
		const error = await pending;
		expect((error as Error).name).toBe('TimeoutError');
		expect(received?.aborted).toBe(true);
	});

	it('classifyResult applies, and a classified failure is recorded once', async () => {
		const slot = createRequestSlot({ minSpacingMs: 0 });
		await observeSlottedProviderRequest(
			{ ...base, context: {}, classifyError, classifyResult: () => 'miss' },
			slot,
			async () => 'empty'
		);
		await observeSlottedProviderRequest({ ...base, context: {}, classifyError }, slot, async () => {
			throw new Error('boom');
		}).catch(() => undefined);
		expect(labels()).toEqual([live('miss'), live('error', 'other')]);
	});
});
