import { afterEach, describe, expect, it } from 'vitest';
import {
	clampSlotRefusalHintMs,
	createRequestSlot,
	DEADLINE_GRACE_MS,
	getProcessRequestSlot,
	isUnsentSlotRefusal,
	type RequestSlotOptions,
	RequestSlotRejectedError,
	RequestSlotTimeoutError,
	resetProcessRequestSlotsForTests,
	SLOT_REFUSAL_RETRY_FLOOR_MS,
	SLOT_REFUSAL_RETRY_MAX_MS,
	slotRefusalOf,
	slotRefusalRetryDelayMs,
} from './request-slot';
import { createVirtualClock } from './testing/virtual-clock';

function deferred<T = void>() {
	let resolve!: (value: T) => void;
	let reject!: (error: unknown) => void;
	const promise = new Promise<T>((res, rej) => {
		resolve = res;
		reject = rej;
	});
	return { promise, resolve, reject };
}

function harness(options: Omit<RequestSlotOptions, 'now' | 'wallNow' | 'sleep'>) {
	const clock = createVirtualClock();
	const slot = createRequestSlot({
		...options,
		now: clock.now,
		wallNow: clock.wallNow,
		sleep: clock.sleep,
	});
	return { clock, slot };
}

const settle = async (promise: Promise<unknown>): Promise<{ value?: unknown; error?: unknown }> =>
	await promise.then(
		(value) => ({ value }),
		(error: unknown) => ({ error })
	);

afterEach(() => resetProcessRequestSlotsForTests());

describe('createRequestSlot defaults (OpenLibrary / MusicBrainz behaviour)', () => {
	it('runs one request at a time, in order', async () => {
		const { slot, clock } = harness({ minSpacingMs: 0 });
		const log: string[] = [];
		const gate = deferred();
		const first = slot.run(async () => {
			log.push('a:start');
			await gate.promise;
			log.push('a:end');
		});
		const second = slot.run(async () => {
			log.push('b:start');
		});
		await clock.flush();
		expect(log).toEqual(['a:start']);
		gate.resolve();
		await Promise.all([first, second]);
		expect(log).toEqual(['a:start', 'a:end', 'b:start']);
		expect(clock.sleeps).toEqual([]);
		expect(clock.pendingTimers()).toBe(0);
	});

	it('starts the first request at once and spaces the next from the END of the previous one', async () => {
		const { slot, clock } = harness({ minSpacingMs: 60 });
		const startedAt: number[] = [];
		const firstGate = deferred();
		const first = slot.run(async () => {
			startedAt.push(clock.now());
			await firstGate.promise;
		});
		const second = slot.run(async () => {
			startedAt.push(clock.now());
		});
		await clock.flush();
		expect(clock.sleeps).toEqual([]);
		await clock.advance(40);
		firstGate.resolve();
		await first;
		// 40 ms of work, then exactly the full 60 ms gap from the end.
		await clock.flush();
		expect(clock.sleeps).toEqual([60]);
		await clock.advance(59);
		expect(startedAt).toHaveLength(1);
		await clock.advance(1);
		await second;
		expect(startedAt).toHaveLength(2);
		expect((startedAt[1] ?? 0) - (startedAt[0] ?? 0)).toBe(100);
		expect(clock.pendingTimers()).toBe(0);
	});

	it('does not wait when the spacing has already elapsed', async () => {
		const { slot, clock } = harness({ minSpacingMs: 50 });
		await slot.run(async () => undefined);
		await clock.advance(80);
		await slot.run(async () => undefined);
		expect(clock.sleeps).toEqual([]);
		expect(clock.pendingTimers()).toBe(0);
	});

	it('waits only the remainder of the spacing', async () => {
		const { slot, clock } = harness({ minSpacingMs: 100 });
		await slot.run(async () => undefined);
		await clock.advance(30);
		const second = slot.run(async () => 'second');
		await clock.flush();
		expect(clock.sleeps).toEqual([70]);
		await clock.advance(70);
		expect(await second).toBe('second');
	});

	it('a failed request still occupies its slot and never blocks the queue', async () => {
		const { slot, clock } = harness({ minSpacingMs: 30 });
		const failed = settle(
			slot.run(async () => {
				throw new Error('boom');
			})
		);
		const second = slot.run(async () => 'second');
		await clock.flush();
		expect(clock.sleeps).toEqual([30]);
		await clock.advance(30);
		expect(((await failed).error as Error).message).toBe('boom');
		expect(await second).toBe('second');
	});

	it('a request that throws synchronously rejects and releases the slot', async () => {
		const { slot } = harness({ minSpacingMs: 0 });
		const failed = await settle(
			slot.run((() => {
				throw new Error('sync');
			}) as () => Promise<never>)
		);
		expect((failed.error as Error).message).toBe('sync');
		expect(await slot.run(async () => 'next')).toBe('next');
	});

	it('has an unbounded queue by default', async () => {
		const { slot } = harness({ minSpacingMs: 0 });
		const gate = deferred();
		const runs = Array.from({ length: 50 }, () => slot.run(() => gate.promise.then(() => 1)));
		gate.resolve();
		expect((await Promise.all(runs)).length).toBe(50);
	});

	it('keeps separate slots independent', async () => {
		const a = harness({ minSpacingMs: 80 });
		const b = harness({ minSpacingMs: 80 });
		await a.slot.run(async () => undefined);
		await b.slot.run(async () => undefined);
		expect(b.clock.sleeps).toEqual([]);
	});

	it('works on the real clocks too (default now, wallNow and sleep)', async () => {
		const slot = createRequestSlot({ minSpacingMs: 40 });
		const starts: number[] = [];
		await Promise.all([
			slot.run(async () => void starts.push(performance.now())),
			slot.run(async () => void starts.push(performance.now())),
		]);
		expect((starts[1] ?? 0) - (starts[0] ?? 0)).toBeGreaterThanOrEqual(35);
	});
});

describe('createRequestSlot abort and deadline', () => {
	it('rejects a signal that is already aborted without running or moving the spacing', async () => {
		const { slot, clock } = harness({ minSpacingMs: 1000 });
		const controller = new AbortController();
		controller.abort(new Error('gone'));
		let ran = false;
		const result = await settle(
			slot.run(
				async () => {
					ran = true;
				},
				{ signal: controller.signal }
			)
		);
		expect((result.error as Error).message).toBe('gone');
		expect(ran).toBe(false);
		// The next real request is not delayed: nothing was dialled.
		await slot.run(async () => undefined);
		expect(clock.sleeps).toEqual([]);
	});

	it('an entry aborted while queued rejects at once with the reason, never runs, and does not delay the others', async () => {
		const { slot, clock } = harness({ minSpacingMs: 1000 });
		await slot.run(async () => undefined);
		const ran: string[] = [];
		const a = new AbortController();
		const b = new AbortController();
		const deadA = settle(slot.run(async () => void ran.push('a'), { signal: a.signal }));
		const deadB = settle(slot.run(async () => void ran.push('b'), { signal: b.signal }));
		const live = slot.run(async () => {
			ran.push('live');
			return clock.now();
		});
		await clock.flush();
		a.abort(new Error('a left'));
		b.abort(new Error('b left'));
		// Rejected immediately, before any time has passed.
		expect(((await deadA).error as Error).message).toBe('a left');
		expect(((await deadB).error as Error).message).toBe('b left');
		await clock.advance(1000);
		// Without the fix two dead entries would have pushed this to 3000.
		expect(await live).toBe(2000);
		expect(ran).toEqual(['live']);
		expect(clock.pendingTimers()).toBe(0);
	});

	it('cancels the pump timer when every waiter aborted, leaving no timer pending', async () => {
		const { slot, clock } = harness({ minSpacingMs: 500 });
		await slot.run(async () => undefined);
		const controller = new AbortController();
		const dead = settle(slot.run(async () => undefined, { signal: controller.signal }));
		await clock.flush();
		expect(clock.pendingTimers()).toBe(1);
		controller.abort(new Error('left'));
		await dead;
		expect(clock.pendingTimers()).toBe(0);
		expect(clock.sleeps).toEqual([500]);
	});

	it('fails fast when the spacing owed cannot fit before the deadline, without dialling', async () => {
		const { slot, clock } = harness({ minSpacingMs: 1000 });
		await slot.run(async () => undefined);
		let ran = false;
		const result = await settle(
			slot.run(
				async () => {
					ran = true;
				},
				{ deadlineAtMs: clock.wallNow() + 1000 }
			)
		);
		const error = result.error as RequestSlotRejectedError;
		expect(error).toBeInstanceOf(RequestSlotRejectedError);
		expect(error.reason).toBe('deadline');
		expect(error.earliestStartAtMs).toBe(clock.wallNow() + 1000);
		expect(ran).toBe(false);
		expect(clock.sleeps).toEqual([]);
		// Starting one ms before the deadline is admitted.
		const fits = slot.run(async () => 'ran', { deadlineAtMs: clock.wallNow() + 1001 });
		await clock.advance(1000);
		expect(await fits).toBe('ran');
	});

	it('counts the waiters ahead in the deadline bound, and rejecting one does not consume spacing', async () => {
		const { slot, clock } = harness({ minSpacingMs: 100 });
		await slot.run(async () => undefined);
		const ahead = slot.run(async () => 'ahead');
		// Earliest start for the next is 100 (owed) + 100 (the waiter ahead) = 200.
		const tooLate = await settle(
			slot.run(async () => 'x', { deadlineAtMs: clock.wallNow() + 200 })
		);
		expect((tooLate.error as RequestSlotRejectedError).reason).toBe('deadline');
		const fits = slot.run(async () => 'fits', { deadlineAtMs: clock.wallNow() + 201 });
		await clock.advance(200);
		expect([await ahead, await fits]).toEqual(['ahead', 'fits']);
	});

	it('a deadline that passes while queued rejects with a TimeoutError, never runs, and frees the lane', async () => {
		const { slot, clock } = harness({ minSpacingMs: 0 });
		const hold = deferred();
		const holder = slot.run(() => hold.promise);
		let ran = false;
		const waiting = settle(
			slot.run(
				async () => {
					ran = true;
				},
				{ deadlineAtMs: clock.wallNow() + 100 }
			)
		);
		await clock.advance(99);
		expect(ran).toBe(false);
		await clock.advance(1);
		const error = (await waiting).error as Error;
		expect(error).toBeInstanceOf(RequestSlotTimeoutError);
		expect((error as RequestSlotTimeoutError).dialled).toBe(false);
		expect(ran).toBe(false);
		hold.resolve();
		await holder;
		expect(clock.pendingTimers()).toBe(0);
	});

	it('a running request that never settles is released when the caller aborts', async () => {
		const { slot, clock } = harness({ minSpacingMs: 0 });
		const controller = new AbortController();
		let received: AbortSignal | undefined;
		const hung = settle(
			slot.run(
				(signal) => {
					received = signal;
					return new Promise<never>(() => {});
				},
				{ signal: controller.signal }
			)
		);
		const next = slot.run(async () => 'next');
		await clock.flush();
		controller.abort(new Error('user left'));
		expect(((await hung).error as Error).message).toBe('user left');
		expect(received?.aborted).toBe(true);
		expect(await next).toBe('next');
	});

	it('a running request that never settles is released at its deadline plus the grace', async () => {
		const { slot, clock } = harness({ minSpacingMs: 0 });
		let received: AbortSignal | undefined;
		const late = deferred<string>();
		const hung = settle(
			slot.run(
				(signal) => {
					received = signal;
					return late.promise;
				},
				{ deadlineAtMs: clock.wallNow() + 100 }
			)
		);
		let nextRan = false;
		const next = slot.run(async () => {
			nextRan = true;
			return 'next';
		});
		await clock.advance(100 + DEADLINE_GRACE_MS - 1);
		expect(nextRan).toBe(false);
		await clock.advance(1);
		expect(((await hung).error as Error).name).toBe('TimeoutError');
		expect(received?.aborted).toBe(true);
		expect(await next).toBe('next');
		// A late settle of the abandoned request changes nothing.
		late.resolve('late');
		await clock.flush();
		expect(clock.pendingTimers()).toBe(0);
	});

	it('the request signal follows the caller signal while running', async () => {
		const { slot, clock } = harness({ minSpacingMs: 0 });
		const controller = new AbortController();
		const gate = deferred();
		let received: AbortSignal | undefined;
		const run = settle(
			slot.run(
				async (signal) => {
					received = signal;
					await gate.promise;
				},
				{ signal: controller.signal }
			)
		);
		await clock.flush();
		expect(received?.aborted).toBe(false);
		gate.resolve();
		await run;
		expect(clock.pendingTimers()).toBe(0);
	});

	it('a request that settles before its deadline leaves no timer and no listener behind', async () => {
		const { slot, clock } = harness({ minSpacingMs: 0 });
		const controller = new AbortController();
		await slot.run(async () => 'ok', {
			signal: controller.signal,
			deadlineAtMs: clock.wallNow() + 10_000,
		});
		expect(clock.pendingTimers()).toBe(0);
		controller.abort(new Error('after'));
		await clock.flush();
	});
});

describe('createRequestSlot: a waiter that gave up never dials', () => {
	it('entries sharing one aborted signal: only the running one ever dialled', async () => {
		const { slot, clock } = harness({ minSpacingMs: 0 });
		const controller = new AbortController();
		const dials: string[] = [];
		const a = settle(
			slot.run(
				() => {
					dials.push('A');
					return new Promise<never>(() => {});
				},
				{ signal: controller.signal }
			)
		);
		const b = settle(
			slot.run(
				async () => {
					dials.push('B');
				},
				{ signal: controller.signal }
			)
		);
		controller.abort(new Error('worker shutdown'));
		await clock.flush();
		expect(dials).toEqual(['A']);
		expect(((await a).error as Error).message).toBe('worker shutdown');
		expect(((await b).error as Error).message).toBe('worker shutdown');
		expect(clock.pendingTimers()).toBe(0);
	});

	it('with every lane full, aborting the shared signal dials only the entries that were running', async () => {
		const { slot, clock } = harness({ minSpacingMs: 0, maxConcurrent: 2, spacingFrom: 'start' });
		const controller = new AbortController();
		const dials: string[] = [];
		for (const name of ['A', 'B', 'C']) {
			slot
				.run(
					() => {
						dials.push(name);
						return new Promise<never>(() => {});
					},
					{ signal: controller.signal }
				)
				.catch(() => undefined);
		}
		controller.abort();
		await clock.flush();
		expect(dials).toEqual(['A', 'B']);
	});

	it('per-item signals derived from one parent (worker shutdown) dial only the first', async () => {
		const { slot, clock } = harness({ minSpacingMs: 0 });
		const parent = new AbortController();
		const dials: string[] = [];
		for (const name of ['A', 'B', 'C']) {
			slot
				.run(
					() => {
						dials.push(name);
						return new Promise<never>(() => {});
					},
					{ signal: AbortSignal.any([parent.signal]) }
				)
				.catch(() => undefined);
		}
		parent.abort();
		await clock.flush();
		expect(dials).toEqual(['A']);
	});

	it('an aborted waiter moves neither the in-flight count nor the spacing, and the next live one still runs', async () => {
		const { slot, clock } = harness({ minSpacingMs: 500, maxConcurrent: 2, spacingFrom: 'start' });
		const controller = new AbortController();
		slot
			.run(() => new Promise<never>(() => {}), { signal: controller.signal })
			.catch(() => undefined);
		const dead = settle(slot.run(async () => 'dead', { signal: controller.signal }));
		const live = slot.run(async () => clock.now());
		controller.abort(new Error('left'));
		await dead;
		await clock.advance(500);
		// Started 500 ms after the first start, not 1000: the dead waiter consumed no spacing.
		expect(await live).toBe(1500);
	});

	it('a waiter whose deadline passed while the event loop stalled is rejected, not dialled', async () => {
		const { slot, clock } = harness({ minSpacingMs: 0 });
		const hold = deferred();
		const holder = slot.run(() => hold.promise);
		let dialled = false;
		const waiting = settle(
			slot.run(
				async () => {
					dialled = true;
				},
				{ deadlineAtMs: clock.wallNow() + 20 }
			)
		);
		// The loop stalled 40 ms: the deadline passed but its timer has not fired yet.
		clock.jump(40);
		hold.resolve();
		await holder;
		const error = (await waiting).error;
		expect(error).toBeInstanceOf(RequestSlotTimeoutError);
		expect(dialled).toBe(false);
		await clock.flush();
		expect(clock.pendingTimers()).toBe(0);
	});
});

describe('createRequestSlot maxConcurrent / maxQueue / spacingFrom', () => {
	it('allows maxConcurrent requests in flight and no more', async () => {
		const { slot, clock } = harness({ minSpacingMs: 0, maxConcurrent: 2, spacingFrom: 'start' });
		let active = 0;
		let peak = 0;
		const gates = [deferred(), deferred(), deferred(), deferred()];
		const runs = gates.map((gate) =>
			slot.run(async () => {
				active += 1;
				peak = Math.max(peak, active);
				await gate.promise;
				active -= 1;
			})
		);
		await clock.flush();
		expect(active).toBe(2);
		for (const gate of gates) {
			gate.resolve();
			await clock.flush();
		}
		await Promise.all(runs);
		expect(peak).toBe(2);
	});

	it('spaces STARTS when spacingFrom is start, regardless of request length', async () => {
		const { slot, clock } = harness({ minSpacingMs: 60, maxConcurrent: 2, spacingFrom: 'start' });
		const starts: number[] = [];
		const gate = deferred();
		const runs = [0, 1, 2].map(() =>
			slot.run(async () => {
				starts.push(clock.now());
				await gate.promise;
			})
		);
		await clock.advance(200);
		const t0 = starts[0] ?? 0;
		expect(starts).toHaveLength(2);
		expect((starts[1] ?? 0) - t0).toBe(60);
		gate.resolve();
		await clock.flush();
		await Promise.all(runs);
		// The third waited for a free lane (the gate), then needed no further spacing.
		expect((starts[2] ?? 0) - (starts[1] ?? 0)).toBe(140);
		expect(clock.sleeps).toEqual([60]);
	});

	it('rejects with queue_full when the queue is full, without running the request', async () => {
		const { slot, clock } = harness({ minSpacingMs: 0, maxQueue: 2 });
		const gate = deferred();
		const ran: string[] = [];
		const make = (name: string) =>
			slot.run(async () => {
				ran.push(name);
				await gate.promise;
			});
		const running = make('running');
		const q1 = make('q1');
		const q2 = make('q2');
		const overflow = await settle(make('overflow'));
		const error = overflow.error as RequestSlotRejectedError;
		expect(error).toBeInstanceOf(RequestSlotRejectedError);
		expect(error.reason).toBe('queue_full');
		await clock.flush();
		gate.resolve();
		await Promise.all([running, q1, q2]);
		expect(ran).toEqual(['running', 'q1', 'q2']);
	});

	it('admits a request that can start now regardless of maxQueue (even 0)', async () => {
		const { slot } = harness({ minSpacingMs: 0, maxQueue: 0 });
		expect(await slot.run(async () => 'ran')).toBe('ran');
		expect(await slot.run(async () => 'ran again')).toBe('ran again');
	});

	it('with maxQueue 0 a request that would have to wait is rejected', async () => {
		const { slot } = harness({ minSpacingMs: 0, maxQueue: 0 });
		const gate = deferred();
		const running = slot.run(() => gate.promise);
		const rejected = await settle(slot.run(async () => 'x'));
		expect((rejected.error as RequestSlotRejectedError).reason).toBe('queue_full');
		gate.resolve();
		await running;
	});

	it('counts a spacing wait as waiting: within spacing, the queue budget applies', async () => {
		const { slot, clock } = harness({
			minSpacingMs: 80,
			maxConcurrent: 2,
			maxQueue: 1,
			spacingFrom: 'start',
		});
		const first = slot.run(async () => 'first');
		const second = slot.run(async () => 'second');
		const third = await settle(slot.run(async () => 'third'));
		expect((third.error as RequestSlotRejectedError).reason).toBe('queue_full');
		await clock.advance(80);
		expect(await Promise.all([first, second])).toEqual(['first', 'second']);
	});

	it('a rejected request does not consume spacing or a waiter', async () => {
		const { slot } = harness({ minSpacingMs: 0, maxQueue: 1 });
		const gate = deferred();
		const running = slot.run(() => gate.promise);
		const queued = slot.run(async () => 'queued');
		await settle(slot.run(async () => 'x'));
		gate.resolve();
		await running;
		expect(await queued).toBe('queued');
		expect(await slot.run(async () => 'after')).toBe('after');
	});

	it('an aborted waiter frees its queue budget at once', async () => {
		const { slot, clock } = harness({ minSpacingMs: 0, maxQueue: 1 });
		const gate = deferred();
		const running = slot.run(() => gate.promise);
		const controller = new AbortController();
		const dead = settle(slot.run(async () => 'dead', { signal: controller.signal }));
		const full = await settle(slot.run(async () => 'x'));
		expect((full.error as RequestSlotRejectedError).reason).toBe('queue_full');
		controller.abort(new Error('left'));
		await dead;
		// A live waiter now fits where the dead one was.
		const replacement = slot.run(async () => 'replacement');
		await clock.flush();
		gate.resolve();
		await running;
		expect(await replacement).toBe('replacement');
	});
});

describe('createRequestSlot option validation', () => {
	it('throws on options that cannot work', () => {
		for (const options of [
			{ minSpacingMs: -1 },
			{ minSpacingMs: Number.NaN },
			{ minSpacingMs: Number.POSITIVE_INFINITY },
			{ minSpacingMs: 0, maxConcurrent: 0 },
			{ minSpacingMs: 0, maxConcurrent: 1.5 },
			{ minSpacingMs: 0, maxConcurrent: Number.NaN },
			{ minSpacingMs: 0, maxQueue: -1 },
			{ minSpacingMs: 0, maxQueue: Number.NaN },
			{ minSpacingMs: 0, maxConcurrent: 2 },
			{ minSpacingMs: 0, maxConcurrent: 2, spacingFrom: 'end' as const },
			{ minSpacingMs: 0, spacingFrom: 'middle' as unknown as 'end' },
		]) {
			expect(() => createRequestSlot(options)).toThrow(RangeError);
		}
	});

	it('accepts the legal combinations', () => {
		expect(() => createRequestSlot({ minSpacingMs: 0 })).not.toThrow();
		expect(() =>
			createRequestSlot({ minSpacingMs: 3000, maxConcurrent: 2, maxQueue: 3, spacingFrom: 'start' })
		).not.toThrow();
		expect(() => createRequestSlot({ minSpacingMs: 1, maxQueue: 0 })).not.toThrow();
	});
});

describe('getProcessRequestSlot', () => {
	it('returns one slot per key and shares its pacing between callers', async () => {
		const a = getProcessRequestSlot('openlibrary', { minSpacingMs: 25 });
		const b = getProcessRequestSlot('openlibrary', { minSpacingMs: 25 });
		expect(b).toBe(a);
		const starts: number[] = [];
		await Promise.all([
			a.run(async () => void starts.push(performance.now())),
			b.run(async () => void starts.push(performance.now())),
		]);
		expect((starts[1] ?? 0) - (starts[0] ?? 0)).toBeGreaterThanOrEqual(20);
	});

	it('keeps different keys independent, so a run-level gate never shares its provider slot', () => {
		const provider = getProcessRequestSlot('apple-music', {
			minSpacingMs: 3000,
			maxConcurrent: 2,
			spacingFrom: 'start',
		});
		const gate = getProcessRequestSlot('apple-music:track-preview', {
			minSpacingMs: 0,
			maxQueue: 3,
		});
		expect(gate).not.toBe(provider);
	});

	it('throws when a key is reused with different pacing, counting defaults as equal', () => {
		getProcessRequestSlot('musicbrainz', { minSpacingMs: 1000 });
		expect(() =>
			getProcessRequestSlot('musicbrainz', {
				minSpacingMs: 1000,
				maxConcurrent: 1,
				spacingFrom: 'end',
			})
		).not.toThrow();
		expect(() => getProcessRequestSlot('musicbrainz', { minSpacingMs: 500 })).toThrow(
			/different pacing/
		);
		expect(() => getProcessRequestSlot('musicbrainz', { minSpacingMs: 1000, maxQueue: 2 })).toThrow(
			/different pacing/
		);
	});

	it('spells Infinity out in the mismatch message', () => {
		getProcessRequestSlot('mb-inf', { minSpacingMs: 1000 });
		expect(() => getProcessRequestSlot('mb-inf', { minSpacingMs: 1000, maxQueue: 3 })).toThrow(
			/maxQueue: Infinity.*maxQueue: 3/
		);
	});

	it('forgets every slot on reset', () => {
		const first = getProcessRequestSlot('spotify', { minSpacingMs: 10 });
		resetProcessRequestSlotsForTests();
		expect(getProcessRequestSlot('spotify', { minSpacingMs: 20 })).not.toBe(first);
	});

	it('forgets only the named key when given one', () => {
		const spotify = getProcessRequestSlot('spotify', { minSpacingMs: 10 });
		const gate = getProcessRequestSlot('apple-music:track-preview', { minSpacingMs: 10 });
		resetProcessRequestSlotsForTests('apple-music:track-preview');
		expect(getProcessRequestSlot('spotify', { minSpacingMs: 10 })).toBe(spotify);
		expect(getProcessRequestSlot('apple-music:track-preview', { minSpacingMs: 20 })).not.toBe(gate);
	});
});

// ENG-17116: what a caller that wants to retry a refusal can read off the slot's errors.
describe('createRequestSlot refusals carry a retry hint and say whether anything was dialled', () => {
	it('a deadline that passes while the request still queued is dialled: false', async () => {
		const { slot, clock } = harness({ minSpacingMs: 0 });
		const hold = deferred();
		const holder = slot.run(() => hold.promise);
		const waiting = settle(slot.run(async () => 'x', { deadlineAtMs: clock.wallNow() + 100 }));
		await clock.advance(100);
		const error = (await waiting).error as RequestSlotTimeoutError;
		expect(error).toBeInstanceOf(RequestSlotTimeoutError);
		expect(error.dialled).toBe(false);
		expect(slotRefusalOf(error)).toEqual({ reason: 'queued_deadline', retryAfterMs: undefined });
		hold.resolve();
		await holder;
	});

	it('a deadline that passed while the event loop stalled is dialled: false too (the waiter is never dialled)', async () => {
		const { slot, clock } = harness({ minSpacingMs: 0 });
		const hold = deferred();
		const holder = slot.run(() => hold.promise);
		const waiting = settle(slot.run(async () => 'x', { deadlineAtMs: clock.wallNow() + 20 }));
		clock.jump(40);
		hold.resolve();
		await holder;
		expect(((await waiting).error as RequestSlotTimeoutError).dialled).toBe(false);
	});

	it('a hung request with no engine timer is given up after the deadline plus grace: dialled: true, not a refusal', async () => {
		const { slot, clock } = harness({ minSpacingMs: 0 });
		let dials = 0;
		const hung = settle(
			slot.run(
				() => {
					dials += 1;
					return new Promise<never>(() => {});
				},
				{ deadlineAtMs: clock.wallNow() + 100 }
			)
		);
		await clock.advance(100);
		expect(dials).toBe(1);
		// Still waiting on the grace period: nothing settled yet.
		let settled = false;
		void hung.then(() => {
			settled = true;
		});
		await clock.flush();
		expect(settled).toBe(false);
		await clock.advance(DEADLINE_GRACE_MS);
		const error = (await hung).error as RequestSlotTimeoutError;
		expect(error).toBeInstanceOf(RequestSlotTimeoutError);
		expect(error.dialled).toBe(true);
		// The request was sent: this is the provider overrunning, not our slot refusing.
		expect(slotRefusalOf(error)).toBeUndefined();
		expect(isUnsentSlotRefusal(error)).toBe(false);
	});

	it('queue_full hints the spacing still owed plus one spacing, shrinking as time passes', async () => {
		const { slot, clock } = harness({ minSpacingMs: 1000, maxQueue: 1 });
		await slot.run(async () => undefined); // spacing owed: 1000
		const queued = slot.run(async () => 'queued');
		const refused = (await settle(slot.run(async () => 'full'))).error as RequestSlotRejectedError;
		expect(refused.reason).toBe('queue_full');
		expect(refused.earliestStartAtMs).toBeUndefined();
		expect(refused.retryAfterMs).toBe(2000);
		await clock.advance(400);
		const later = (await settle(slot.run(async () => 'full'))).error as RequestSlotRejectedError;
		expect(later.retryAfterMs).toBe(1600);
		expect(slotRefusalOf(later)).toEqual({ reason: 'queue_full', retryAfterMs: 1600 });
		await clock.advance(1000);
		await queued;
	});

	it('queue_full with nothing owed hints one spacing (never 0 or undefined)', async () => {
		const { slot } = harness({ minSpacingMs: 750, maxQueue: 0 });
		const hold = deferred();
		const holder = slot.run(() => hold.promise);
		const refused = (await settle(slot.run(async () => 'x'))).error as RequestSlotRejectedError;
		expect(refused.retryAfterMs).toBe(750);
		hold.resolve();
		await holder;
	});

	it("deadline hints the same delay earliestStartAtMs is derived from, on the slot's own clock", async () => {
		const { slot, clock } = harness({ minSpacingMs: 100 });
		await slot.run(async () => undefined);
		const ahead = slot.run(async () => 'ahead');
		const before = clock.wallNow();
		const refused = (await settle(slot.run(async () => 'x', { deadlineAtMs: before + 200 })))
			.error as RequestSlotRejectedError;
		// 100 owed + 100 for the waiter ahead.
		expect(refused.retryAfterMs).toBe(200);
		expect(refused.earliestStartAtMs).toBe(before + (refused.retryAfterMs ?? Number.NaN));
		await clock.advance(200);
		await ahead;
	});
});

describe('slot refusal predicate and retry delay (ENG-17116)', () => {
	it('slotRefusalOf is true for the three unsent refusals and nothing else', () => {
		expect(slotRefusalOf(new RequestSlotRejectedError('queue_full', undefined, 500))).toEqual({
			reason: 'queue_full',
			retryAfterMs: 500,
		});
		expect(slotRefusalOf(new RequestSlotRejectedError('deadline', 5, 5))).toEqual({
			reason: 'deadline',
			retryAfterMs: 5,
		});
		expect(slotRefusalOf(new RequestSlotTimeoutError(false))?.reason).toBe('queued_deadline');
		for (const other of [
			new RequestSlotTimeoutError(true),
			new Error('Request slot queue is full'),
			Object.assign(new Error('x'), { name: 'RequestSlotRejectedError' }),
			undefined,
			null,
			'queue_full',
		]) {
			expect(slotRefusalOf(other)).toBeUndefined();
			expect(isUnsentSlotRefusal(other)).toBe(false);
		}
	});

	it('a hint that is not a finite number is dropped by the error itself, a negative one is 0', () => {
		expect(
			new RequestSlotRejectedError('queue_full', undefined, Number.NaN).retryAfterMs
		).toBeUndefined();
		expect(
			new RequestSlotRejectedError('queue_full', undefined, Number.POSITIVE_INFINITY).retryAfterMs
		).toBeUndefined();
		expect(new RequestSlotRejectedError('queue_full', undefined, -5).retryAfterMs).toBe(0);
		expect(new RequestSlotRejectedError('queue_full').retryAfterMs).toBeUndefined();
	});

	it('clamps a hint to [FLOOR, MAX]: 0 and missing give the floor, a huge hint gives 30 s', () => {
		expect(SLOT_REFUSAL_RETRY_FLOOR_MS).toBe(1_000);
		expect(SLOT_REFUSAL_RETRY_MAX_MS).toBe(30_000);
		expect(clampSlotRefusalHintMs(0)).toBe(1_000);
		expect(clampSlotRefusalHintMs(undefined)).toBe(1_000);
		expect(clampSlotRefusalHintMs(Number.NaN)).toBe(1_000);
		expect(clampSlotRefusalHintMs(2_500)).toBe(2_500);
		expect(clampSlotRefusalHintMs(60 * 60_000)).toBe(30_000);
		expect(clampSlotRefusalHintMs(Number.POSITIVE_INFINITY)).toBe(1_000);
	});

	it('the delay is the clamped hint plus up to half of it in jitter, never above 30 s', () => {
		expect(slotRefusalRetryDelayMs(4_000, () => 0)).toBe(4_000);
		expect(slotRefusalRetryDelayMs(4_000, () => 0.5)).toBe(5_000);
		expect(slotRefusalRetryDelayMs(4_000, () => 0.999)).toBe(5_998);
		expect(slotRefusalRetryDelayMs(0, () => 0.5)).toBe(1_250);
		expect(slotRefusalRetryDelayMs(1_000_000, () => 0.999)).toBe(30_000);
		expect(slotRefusalRetryDelayMs(25_000, () => 0.999)).toBe(30_000);
		// A random source outside [0, 1) cannot push the delay out of range.
		expect(slotRefusalRetryDelayMs(4_000, () => 7)).toBe(6_000);
		expect(slotRefusalRetryDelayMs(4_000, () => -3)).toBe(4_000);
		expect(slotRefusalRetryDelayMs(4_000, () => Number.NaN)).toBe(4_000);
	});
});
