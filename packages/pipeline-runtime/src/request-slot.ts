/**
 * Paces outbound requests (ENG-16976). Used by enrichment plugins (OpenLibrary
 * 350 ms, MusicBrainz 1 s) and by the track-preview resolver, so it lives here,
 * in the package every producer already depends on.
 *
 * Defaults keep the original contract: requests run one at a time, in order,
 * with `minSpacingMs` between the end of one and the start of the next, and the
 * queue is unbounded. A failed request still occupies its slot and never blocks
 * the queue.
 *
 * Process-wide pacing. A provider's rate limit is per process, not per engine or
 * plugin instance (the api builds one engine per preset), so producers take
 * their slot from {@link getProcessRequestSlot}; {@link createRequestSlot} is for
 * tests and for a throttle that really is private. The key is a string, not a
 * provider name: a run-level admission gate (`apple-music:track-preview`) must not
 * share a key with the plugin's own provider slot, or the run would hold the slot
 * the plugin inside it waits on.
 *
 * Abort and deadline rules (`run`'s `signal` and `deadlineAtMs`):
 * - a signal that is already aborted rejects with its reason; nothing runs;
 * - a waiting entry whose signal aborts is removed at once (freeing its queue
 *   budget), rejects with the signal's reason, never runs and never moves the
 *   spacing. One whose deadline passes while it waits does the same with a
 *   `TimeoutError`;
 * - a request that cannot start strictly before `deadlineAtMs` rejects at once with a
 *   {@link RequestSlotRejectedError} (`deadline`). The bound is a lower bound: the
 *   spacing still owed plus one spacing per entry already waiting;
 * - a waiter dispatched after it gave up (its signal aborted, or its deadline passed while the
 *   event loop stalled) is rejected without dialling and without moving the spacing;
 * - a running request receives a signal that aborts with the caller's signal or at
 *   the deadline. The lane is released when the request settles, when the caller
 *   aborts, or at the deadline plus {@link DEADLINE_GRACE_MS}: a request that never
 *   settles cannot block the queue past its own deadline (its late result is
 *   ignored). Past the deadline the entry rejects with a `TimeoutError`.
 *
 * `maxConcurrent`, `spacingFrom` and `maxQueue` express a throttle such as the
 * track-preview resolver's (2 in flight, 3 s between starts, 3 waiting): a
 * request that would have to wait while `maxQueue` live requests already wait is
 * rejected with {@link RequestSlotRejectedError} (`queue_full`) without running. A
 * request that can start right now is admitted whatever the queue holds.
 *
 * Observation (`observeSlottedProviderRequest`): a {@link RequestSlotRejectedError}, and a deadline
 * reached while the request waits, are recorded as `budget_exhausted` (our own backpressure, no
 * duration), never as `rate_limited`, which is reserved for a real upstream throttle (ENG-17085).
 *
 * Retry hint (ENG-17116): a refusal is not a loss. {@link RequestSlotRejectedError} carries
 * `retryAfterMs`, the slot's own estimate of when it has room, and a deadline reached before the
 * request was handed to the caller ({@link RequestSlotTimeoutError} `dialled: false`) is the same
 * kind of event, so the engine retries both later with a backoff, like a real 429.
 *
 * Time. Spacing is measured on a monotonic clock (`now`, default
 * `performance.now`); deadlines are epoch ms (`wallNow`, default `Date.now`).
 * Both and `sleep` are injectable so tests run on a virtual clock.
 */
export type RequestSlotRunOptions = {
	/** Aborting rejects a waiting or running entry with the signal's reason. */
	signal?: AbortSignal | undefined;
	/** Epoch ms after which the caller no longer wants the response (the engine deadline). */
	deadlineAtMs?: number | undefined;
};

export type RequestSlot = {
	/** `request` receives a signal that aborts on the caller's abort or at the deadline. */
	run<T>(request: (signal: AbortSignal) => Promise<T>, options?: RequestSlotRunOptions): Promise<T>;
};

export type RequestSlotPacing = {
	/** Minimum gap between requests, measured as `spacingFrom` says. >= 0; 0 disables it. */
	minSpacingMs: number;
	/** Requests allowed in flight at once: an integer >= 1. Default 1. */
	maxConcurrent?: number;
	/** Requests allowed to wait for a free lane (live waiters only). >= 0. Default: unbounded. */
	maxQueue?: number;
	/**
	 * `end` (default): the gap runs from the end of the previous request, so a slow
	 * request delays the next one; legal only with `maxConcurrent` 1. `start`: the gap
	 * runs from the previous start, a rate limit independent of how long requests take.
	 */
	spacingFrom?: 'end' | 'start';
};

export type RequestSlotOptions = RequestSlotPacing & {
	/** Monotonic milliseconds. Default `performance.now`. */
	now?: () => number;
	/** Epoch milliseconds, compared with `deadlineAtMs`. Default `Date.now`. */
	wallNow?: () => number;
	/** Resolves after `ms`; rejects (and must release its timer) when `signal` aborts. */
	sleep?: (ms: number, signal: AbortSignal) => Promise<void>;
};

/** How long past its deadline a running request may take to settle before its lane is released. */
export const DEADLINE_GRACE_MS = 50;

/** The slot refused the request: it never ran, so nothing was dialled. */
export class RequestSlotRejectedError extends Error {
	readonly reason: 'queue_full' | 'deadline';
	/** For `deadline`: the earliest epoch ms the request could have started. */
	readonly earliestStartAtMs: number | undefined;
	/**
	 * How long from now until the slot could take a request like this one (ms, >= 0): what a caller
	 * that wants to retry should wait at least. `deadline`: `earliestStartAtMs` minus now.
	 * `queue_full`: the spacing still owed plus one spacing (the head waiter must start first). It is
	 * a lower bound, not a promise: concurrent callers can fill the slot again. Absent on a slot
	 * stub that does not know its pacing.
	 */
	readonly retryAfterMs: number | undefined;
	constructor(
		reason: 'queue_full' | 'deadline',
		earliestStartAtMs?: number,
		retryAfterMs?: number
	) {
		super(
			reason === 'queue_full'
				? 'Request slot queue is full'
				: 'Request slot cannot start the request before its deadline'
		);
		this.name = 'RequestSlotRejectedError';
		this.reason = reason;
		this.earliestStartAtMs = earliestStartAtMs;
		// A hint that is not a finite number is no hint: callers must never see NaN or Infinity.
		this.retryAfterMs =
			retryAfterMs !== undefined && Number.isFinite(retryAfterMs)
				? Math.max(0, retryAfterMs)
				: undefined;
	}
}

/**
 * The deadline passed while the request waited for, or held, a lane. Named `TimeoutError`, so
 * transport classifiers read it as the timeout it is; the observation helpers map it directly.
 */
export class RequestSlotTimeoutError extends Error {
	/**
	 * Whether the request had been handed to the caller's `request` function when the deadline
	 * passed. `false`: it only waited for its lane, nothing was sent, so the lookup can be retried
	 * like a refusal (ENG-17116). `true`: it was sent and overran: a real timeout.
	 */
	readonly dialled: boolean;
	constructor(dialled: boolean) {
		super('Request slot deadline passed');
		this.name = 'TimeoutError';
		this.dialled = dialled;
	}
}

/**
 * Retry policy for a lookup the slot turned away (ENG-17116), shared by everything that retries one
 * (the enrichment engine, the Wikidata identity bridge) so they cannot drift apart.
 *
 * The wait is `max(FLOOR, hint)` plus a random share of it (up to `JITTER_RATIO` of it, so a refused
 * burst spreads out in proportion to how long it has to wait), never more than `MAX`.
 */
export const SLOT_REFUSAL_RETRY_FLOOR_MS = 1_000;
export const SLOT_REFUSAL_RETRY_MAX_MS = 30_000;
export const SLOT_REFUSAL_RETRY_JITTER_RATIO = 0.5;

/**
 * What a slot's unsent refusal means to a caller that wants to retry: `retryAfterMs` is the slot's
 * own hint (finite, >= 0) or undefined when it has none (a `deadline` refusal built without one, a
 * deadline that passed while queued).
 */
export type SlotRefusal = {
	reason: 'queue_full' | 'deadline' | 'queued_deadline';
	retryAfterMs: number | undefined;
};

/**
 * The single answer to "did our own pacing slot turn this request away before anything was sent?"
 * `RequestSlotRejectedError` (queue full, or it cannot start before the deadline) and a
 * `RequestSlotTimeoutError` that never dialled are refusals. A `RequestSlotTimeoutError` raised
 * after the dial is the provider overrunning: a real timeout, not a refusal.
 */
export function slotRefusalOf(error: unknown): SlotRefusal | undefined {
	if (error instanceof RequestSlotRejectedError) {
		return { reason: error.reason, retryAfterMs: error.retryAfterMs };
	}
	if (error instanceof RequestSlotTimeoutError && !error.dialled) {
		return { reason: 'queued_deadline', retryAfterMs: undefined };
	}
	return undefined;
}

export function isUnsentSlotRefusal(error: unknown): boolean {
	return slotRefusalOf(error) !== undefined;
}

/**
 * Clamps a slot hint to what any retrier may honor: at least FLOOR, at most MAX; a missing or
 * non-finite hint is FLOOR.
 */
export function clampSlotRefusalHintMs(hintMs: number | undefined): number {
	const hint = hintMs !== undefined && Number.isFinite(hintMs) ? hintMs : 0;
	return Math.min(SLOT_REFUSAL_RETRY_MAX_MS, Math.max(SLOT_REFUSAL_RETRY_FLOOR_MS, hint));
}

/**
 * The delay before a refused lookup is retried: the clamped hint plus jitter proportional to it,
 * never above MAX. `random` returns [0, 1) (default `Math.random`).
 */
export function slotRefusalRetryDelayMs(
	hintMs: number | undefined,
	random: () => number = Math.random
): number {
	const wait = clampSlotRefusalHintMs(hintMs);
	const drawn = random();
	const sample = Number.isFinite(drawn) ? Math.min(1, Math.max(0, drawn)) : 0;
	const jitter = Math.floor(sample * wait * SLOT_REFUSAL_RETRY_JITTER_RATIO);
	return Math.min(SLOT_REFUSAL_RETRY_MAX_MS, wait + jitter);
}

function timeoutError(dialled: boolean): RequestSlotTimeoutError {
	return new RequestSlotTimeoutError(dialled);
}

function defaultSleep(ms: number, signal: AbortSignal): Promise<void> {
	return new Promise((resolve, reject) => {
		if (signal.aborted) {
			reject(signal.reason);
			return;
		}
		const onAbort = () => {
			clearTimeout(timer);
			reject(signal.reason);
		};
		const timer = setTimeout(() => {
			signal.removeEventListener('abort', onAbort);
			resolve();
		}, ms);
		// A pending pacing timer must not keep the process alive.
		(timer as { unref?: () => void }).unref?.();
		signal.addEventListener('abort', onAbort, { once: true });
	});
}

function validatePacing(pacing: RequestSlotPacing): void {
	const { minSpacingMs, maxConcurrent = 1, maxQueue = Number.POSITIVE_INFINITY } = pacing;
	if (!Number.isFinite(minSpacingMs) || minSpacingMs < 0) {
		throw new RangeError(`minSpacingMs must be a finite number >= 0, got ${minSpacingMs}`);
	}
	if (!Number.isInteger(maxConcurrent) || maxConcurrent < 1) {
		throw new RangeError(`maxConcurrent must be an integer >= 1, got ${maxConcurrent}`);
	}
	if (Number.isNaN(maxQueue) || maxQueue < 0) {
		throw new RangeError(`maxQueue must be >= 0, got ${maxQueue}`);
	}
	if (
		pacing.spacingFrom !== undefined &&
		pacing.spacingFrom !== 'end' &&
		pacing.spacingFrom !== 'start'
	) {
		throw new RangeError(`spacingFrom must be 'end' or 'start', got ${String(pacing.spacingFrom)}`);
	}
	if ((pacing.spacingFrom ?? 'end') === 'end' && maxConcurrent !== 1) {
		throw new RangeError("spacingFrom 'end' is only defined for maxConcurrent 1; use 'start'");
	}
}

type Waiter = {
	start(): void;
	/** Detaches whatever the waiter listens to while it waits. */
	detach(): void;
};

export function createRequestSlot(options: RequestSlotOptions): RequestSlot {
	validatePacing(options);
	const { minSpacingMs } = options;
	const maxConcurrent = options.maxConcurrent ?? 1;
	const maxQueue = options.maxQueue ?? Number.POSITIVE_INFINITY;
	const spacingFrom = options.spacingFrom ?? 'end';
	const now = options.now ?? (() => performance.now());
	const wallNow = options.wallNow ?? (() => Date.now());
	const sleep = options.sleep ?? defaultSleep;

	let inFlight = 0;
	/** Monotonic ms of the last start or end (per `spacingFrom`); undefined before the first dial. */
	let lastRequestAt: number | undefined;
	let pumpTimer: AbortController | undefined;
	const waiters: Waiter[] = [];

	/** Fires `onFire` after `ms` unless the returned function runs first. */
	function startTimer(ms: number, onFire: () => void): () => void {
		const timer = new AbortController();
		sleep(ms, timer.signal).then(onFire, () => undefined);
		return () => timer.abort();
	}

	function spacingOwedMs(): number {
		if (minSpacingMs <= 0 || lastRequestAt === undefined) return 0;
		return Math.max(0, minSpacingMs - (now() - lastRequestAt));
	}

	function canStartNow(): boolean {
		return waiters.length === 0 && inFlight < maxConcurrent && spacingOwedMs() === 0;
	}

	function cancelPumpTimer(): void {
		pumpTimer?.abort();
		pumpTimer = undefined;
	}

	function pump(): void {
		while (waiters.length > 0 && inFlight < maxConcurrent) {
			const owed = spacingOwedMs();
			if (owed > 0) {
				if (pumpTimer === undefined) {
					const timer = new AbortController();
					pumpTimer = timer;
					sleep(owed, timer.signal).then(
						() => {
							if (pumpTimer === timer) pumpTimer = undefined;
							pump();
						},
						() => undefined
					);
				}
				return;
			}
			const next = waiters.shift();
			next?.detach();
			next?.start();
		}
		if (waiters.length === 0) cancelPumpTimer();
	}

	/** How long until a request admitted now would start: spacing owed plus the waiters ahead of it. */
	function startDelayMs(): number {
		return spacingOwedMs() + waiters.length * minSpacingMs;
	}

	function admit(runOptions: RequestSlotRunOptions): RequestSlotRejectedError | undefined {
		const { deadlineAtMs } = runOptions;
		if (deadlineAtMs !== undefined) {
			// Read the clock once: the hint is the same delay the earliest start is derived from.
			const delay = startDelayMs();
			const earliest = wallNow() + delay;
			if (earliest >= deadlineAtMs) {
				return new RequestSlotRejectedError('deadline', earliest, delay);
			}
		}
		if (!canStartNow() && waiters.length >= maxQueue) {
			return new RequestSlotRejectedError('queue_full', undefined, spacingOwedMs() + minSpacingMs);
		}
		return undefined;
	}

	return {
		run(request, runOptions = {}) {
			const { signal, deadlineAtMs } = runOptions;
			if (signal?.aborted) return Promise.reject(signal.reason);
			const refusal = admit(runOptions);
			if (refusal) return Promise.reject(refusal);
			return new Promise((resolve, reject) => {
				const stops: Array<() => void> = [];
				const stopAll = () => {
					for (const stop of stops.splice(0)) stop();
				};
				const leaveQueue = (error: unknown) => {
					const index = waiters.indexOf(waiter);
					if (index < 0) return;
					waiters.splice(index, 1);
					stopAll();
					reject(error);
					if (waiters.length === 0) cancelPumpTimer();
				};
				const waiter: Waiter = {
					detach: stopAll,
					start() {
						// A waiter can be dispatched before its own abort listener ran (an earlier
						// listener on the same signal released a lane and pumped synchronously), or
						// after a stalled event loop let its deadline pass. It gave up: reject
						// without dialling, without moving the in-flight count or the spacing.
						if (signal?.aborted) {
							stopAll();
							reject(signal.reason);
							return;
						}
						if (deadlineAtMs !== undefined && wallNow() >= deadlineAtMs) {
							stopAll();
							reject(timeoutError(false));
							return;
						}
						inFlight += 1;
						if (spacingFrom === 'start') lastRequestAt = now();
						const running = new AbortController();
						let released = false;
						// Release before settling, so a caller that continues right after its
						// own request sees the slot free.
						const release = () => {
							released = true;
							stopAll();
							inFlight -= 1;
							if (spacingFrom === 'end') lastRequestAt = now();
							pump();
						};
						const giveUp = (reason: unknown) => {
							if (released) return;
							running.abort(reason);
							release();
							reject(reason);
						};
						if (signal) {
							const onAbort = () => giveUp(signal.reason);
							signal.addEventListener('abort', onAbort, { once: true });
							stops.push(() => signal.removeEventListener('abort', onAbort));
						}
						if (deadlineAtMs !== undefined) {
							const untilGiveUp = Math.max(0, deadlineAtMs - wallNow()) + DEADLINE_GRACE_MS;
							stops.push(startTimer(untilGiveUp, () => giveUp(timeoutError(true))));
						}
						let pending: Promise<Awaited<ReturnType<typeof request>>>;
						try {
							pending = Promise.resolve(request(running.signal));
						} catch (error) {
							pending = Promise.reject(error);
						}
						pending.then(
							(value) => {
								if (released) return;
								release();
								resolve(value);
							},
							(error: unknown) => {
								if (released) return;
								release();
								reject(error);
							}
						);
					},
				};
				if (signal) {
					const onQueuedAbort = () => leaveQueue(signal.reason);
					signal.addEventListener('abort', onQueuedAbort, { once: true });
					stops.push(() => signal.removeEventListener('abort', onQueuedAbort));
				}
				if (deadlineAtMs !== undefined) {
					const untilDeadline = Math.max(0, deadlineAtMs - wallNow());
					stops.push(startTimer(untilDeadline, () => leaveQueue(timeoutError(false))));
				}
				waiters.push(waiter);
				pump();
			});
		},
	};
}

const processSlots = new Map<string, { slot: RequestSlot; pacing: Required<RequestSlotPacing> }>();

/** JSON.stringify renders Infinity as null; spell the pacing out. */
function describePacing(pacing: Required<RequestSlotPacing>): string {
	return `{minSpacingMs: ${pacing.minSpacingMs}, maxConcurrent: ${pacing.maxConcurrent}, maxQueue: ${pacing.maxQueue}, spacingFrom: ${pacing.spacingFrom}}`;
}

function normalizedPacing(pacing: RequestSlotPacing): Required<RequestSlotPacing> {
	return {
		minSpacingMs: pacing.minSpacingMs,
		maxConcurrent: pacing.maxConcurrent ?? 1,
		maxQueue: pacing.maxQueue ?? Number.POSITIVE_INFINITY,
		spacingFrom: pacing.spacingFrom ?? 'end',
	};
}

/**
 * The process-wide slot for `key`, created on first use. Every caller with the
 * key in this process (every engine, plugin instance and resolver) paces through
 * the same slot. Plugin slots use the provider name as the key (for example
 * `'openlibrary'`); a run-level gate uses its own key. Asking for an existing key
 * with different pacing throws: one of the two callers would silently get the
 * other's rate.
 */
export function getProcessRequestSlot(key: string, pacing: RequestSlotPacing): RequestSlot {
	const wanted = normalizedPacing(pacing);
	const existing = processSlots.get(key);
	if (existing) {
		const have = existing.pacing;
		if (
			have.minSpacingMs !== wanted.minSpacingMs ||
			have.maxConcurrent !== wanted.maxConcurrent ||
			have.maxQueue !== wanted.maxQueue ||
			have.spacingFrom !== wanted.spacingFrom
		) {
			throw new Error(
				`getProcessRequestSlot("${key}") was created with different pacing: ${describePacing(have)} vs ${describePacing(wanted)}`
			);
		}
		return existing.slot;
	}
	const slot = createRequestSlot(pacing);
	processSlots.set(key, { slot, pacing: wanted });
	return slot;
}

/** Forgets every process-wide slot, or only `key`'s when given. Tests only. */
export function resetProcessRequestSlotsForTests(key?: string): void {
	if (key === undefined) processSlots.clear();
	else processSlots.delete(key);
}
