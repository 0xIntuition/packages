import {
	emitProviderEvent,
	type ProviderReason,
	type ProviderRequestEvent,
} from './provider-observer';
import {
	lookupProviderOperation,
	type ProviderName,
	type ProviderOperationOf,
} from './provider-registry';
import { isUnsentSlotRefusal, type RequestSlot, RequestSlotTimeoutError } from './request-slot';

/**
 * Timers fire a hair before `Date.now()` reaches the deadline they were armed
 * for; an abort this close to the deadline is the deadline.
 */
const DEADLINE_CLOCK_SLACK_MS = 25;

export type ObservedRequestContext = {
	signal?: AbortSignal | undefined;
	/** Epoch ms at which the engine aborts the plugin run; see `EnrichmentPluginContext`. */
	deadlineAtMs?: number | undefined;
};

/** Our own backpressure: nothing was dialled, so the reason is always `none`. */
export type BudgetExhaustedOutcome = { outcome: 'budget_exhausted'; reason: 'none' };

export type RequestOutcome =
	| { outcome: 'hit' | 'miss' | 'error'; reason: ProviderReason }
	| BudgetExhaustedOutcome;

/**
 * Our own pacing refused the request, or its deadline arrived while it still waited for a turn:
 * nothing was dialled, so there is no duration and it says nothing about the provider (ENG-17085).
 */
const BUDGET_EXHAUSTED: BudgetExhaustedOutcome = { outcome: 'budget_exhausted', reason: 'none' };

export function isEngineDeadline(context: ObservedRequestContext): boolean {
	return (
		context.deadlineAtMs !== undefined &&
		Date.now() >= context.deadlineAtMs - DEADLINE_CLOCK_SLACK_MS
	);
}

export type ObservedRequest = {
	/**
	 * The request now waits for a turn of OUR OWN making (a per-host pacing queue) before it can be
	 * dialled. A deadline or cancel that fires before `dialed` records nothing: that wait is our
	 * pacing, not the provider failing to answer. Pass `onDeadline` when a deadline reached in that
	 * wait is itself a signal worth counting: it is recorded instead of nothing (a caller cancel
	 * still records nothing). Without this call a deadline while waiting is a `timeout`.
	 * {@link observeSlottedProviderRequest} calls it with `budget_exhausted`.
	 */
	queued(onDeadline?: BudgetExhaustedOutcome): void;
	/** The request is being dialled now: the duration is measured from here. Default: from `begin`. */
	dialed(): void;
	/** Records the outcome (once) and stops listening to the signal. */
	settle(result: RequestOutcome): void;
	/**
	 * Records a failure. An aborted signal is judged by the abort rules; otherwise
	 * `classify` decides, and `undefined` records nothing.
	 */
	fail(error: unknown, classify: (error: unknown) => RequestOutcome | undefined): void;
	/** Records nothing and stops listening to the signal. */
	drop(): void;
};

/**
 * The pair is checked at compile time: `provider` fixes which `operation`
 * names are accepted.
 */
export type ObservedRequestInput<P extends ProviderName> = {
	provider: P;
	operation: ProviderOperationOf<P>;
	context: ObservedRequestContext;
	/**
	 * `cache` records a result served from another consumer's request in the same run
	 * (ENG-16980): only a hit or a miss, as `source=cache` without a duration. An error is
	 * the request's own and is recorded once, by the consumer that ran it. Default `live`.
	 */
	source?: 'live' | 'cache' | undefined;
};

/**
 * Starts observing one logical provider request (ENG-16466, ENG-16911, ENG-16976).
 * Pure and free of I/O, so enrichment plugins, classification adapters and the
 * trpc resolvers all follow the same rules (contract amendment 5):
 *
 * - a request whose signal was already aborted never started and records nothing;
 * - a caller cancelling the whole enrichment (user navigates away, worker
 *   shutdown) aborts the signal before the engine deadline and records nothing;
 * - the engine deadline records `timeout` the moment the abort fires, even when
 *   the underlying fetch ignores the signal and never settles;
 * - a request that called `queued()` (a pacing wait of our own making) and is still
 *   waiting when the deadline fires records nothing, or the `onDeadline` outcome the
 *   caller gave (a slotted request: `budget_exhausted`, no duration): nothing was
 *   dialled and the wait is our own pacing. `dialed()` ends that state, and the
 *   duration is measured from it;
 * - each request is recorded at most once.
 *
 * Observation only: it never throws, never changes a result and never dials.
 * Provider-specific error classification (for example `ProviderHttpError`)
 * stays with the caller and is passed in as `classifyError`.
 *
 * Returns `undefined` when the signal is already aborted. Call `dialed` when the
 * request actually goes out if it may wait first (see
 * {@link observeSlottedProviderRequest}).
 */

export function beginObservedRequest<P extends ProviderName>(
	input: ObservedRequestInput<P>
): ObservedRequest | undefined {
	const { provider, operation, context } = input;
	const source = input.source ?? 'live';
	const { signal } = context;
	if (signal?.aborted) return undefined;

	let startedAtMs = Date.now();
	let settled = false;
	let waitingForOwnTurn = false;
	// False from `queued()` until `dialed()`: a request that never went out has no duration.
	let dialled = true;
	let deadlineWhileWaiting: BudgetExhaustedOutcome | undefined;
	const settle = (result?: RequestOutcome) => {
		if (settled) return;
		settled = true;
		signal?.removeEventListener('abort', onAbort);
		if (!result) return;
		if (source === 'cache') {
			// Only series the registry declares: an error is the request's own, and an operation
			// without a cache source (or an outcome it cannot have) is not a metric.
			if (result.outcome === 'error') return;
			if (!lookupProviderOperation(provider, operation)?.cacheOutcomes.includes(result.outcome)) {
				return;
			}
			emitProviderEvent({
				type: 'provider_request',
				provider,
				operation,
				outcome: result.outcome,
				reason: result.reason,
				source: 'cache',
			} as ProviderRequestEvent);
			return;
		}
		// TypeScript cannot correlate the generic pair with the event union; the input type did.
		// A request still waiting for its turn was never dialled: no duration, whatever the outcome.
		emitProviderEvent({
			type: 'provider_request',
			provider,
			operation,
			outcome: result.outcome,
			reason: result.reason,
			source: 'live',
			...(dialled ? { durationMs: Date.now() - startedAtMs } : {}),
		} as ProviderRequestEvent);
	};
	const settleAbort = () => {
		if (!isEngineDeadline(context)) return settle(undefined);
		if (waitingForOwnTurn) return settle(deadlineWhileWaiting);
		return settle({ outcome: 'error', reason: 'timeout' });
	};
	const onAbort = () => settleAbort();
	signal?.addEventListener('abort', onAbort, { once: true });

	return {
		queued: (onDeadline) => {
			waitingForOwnTurn = true;
			dialled = false;
			deadlineWhileWaiting = onDeadline;
		},
		dialed: () => {
			waitingForOwnTurn = false;
			dialled = true;
			deadlineWhileWaiting = undefined;
			startedAtMs = Date.now();
		},
		settle: (result) => settle(result),
		fail: (error, classify) => {
			if (signal?.aborted) settleAbort();
			else settle(classify(error));
		},
		drop: () => settle(undefined),
	};
}

// A call that dials never reads a shared request's result: `source` is for `beginObservedRequest` alone.
export type ObserveProviderRequestInput<P extends ProviderName, T> = Omit<
	ObservedRequestInput<P>,
	'source'
> & {
	classifyError: (error: unknown) => RequestOutcome;
	/**
	 * Decides whether a resolved value is a `hit` or a `miss`. Default: every resolved
	 * request is a hit. A provider that answers 200 with an empty result set passes this.
	 */
	classifyResult?: ((value: T) => 'hit' | 'miss') | undefined;
};

function resolvedOutcome<P extends ProviderName, T>(
	input: ObserveProviderRequestInput<P, T>,
	value: T
): RequestOutcome {
	return { outcome: input.classifyResult?.(value) ?? 'hit', reason: 'none' };
}

/** Observes a request that is a single awaited call: resolved is a hit (or per `classifyResult`), a throw is classified. */
export async function observeProviderRequest<P extends ProviderName, T>(
	input: ObserveProviderRequestInput<P, T>,
	request: () => Promise<T>
): Promise<T> {
	const observed = beginObservedRequest(input);
	if (!observed) return await request();
	try {
		const value = await request();
		observed.settle(safeResultOutcome(input, value));
		return value;
	} catch (error) {
		observed.fail(error, input.classifyError);
		throw error;
	}
}

/** A throwing `classifyResult` must not turn a good response into a failure. */
function safeResultOutcome<P extends ProviderName, T>(
	input: ObserveProviderRequestInput<P, T>,
	value: T
): RequestOutcome {
	try {
		return resolvedOutcome(input, value);
	} catch {
		return { outcome: 'hit', reason: 'none' };
	}
}

/**
 * What a failed slotted request means, or undefined when the slot did not decide it.
 *
 * - The slot refused to dial (`RequestSlotRejectedError`: its queue is full, or the request cannot
 *   start before the deadline), or the deadline passed while the request still waited
 *   (`RequestSlotTimeoutError` before the dial, whichever timer fires first): our own backpressure,
 *   `budget_exhausted` (ENG-17085). Nothing was dialled, so no duration, and it is not
 *   `rate_limited`: that reason stays for a real upstream 429 / maxlag.
 * - The deadline passed after the dial (`RequestSlotTimeoutError`): the provider overran, `timeout`.
 */
function classifySlotRefusal(error: unknown): RequestOutcome | undefined {
	if (isUnsentSlotRefusal(error)) return BUDGET_EXHAUSTED;
	if (error instanceof RequestSlotTimeoutError) return { outcome: 'error', reason: 'timeout' };
	return undefined;
}

/**
 * Observes a request that goes through a {@link RequestSlot}. The observation starts at enqueue,
 * but the duration is measured from the moment the slot dials. What happens before the dial,
 * with nothing dialled, is `budget_exhausted` without a duration: the slot refused the request
 * (queue full, or it cannot start before the deadline) or the engine deadline arrived while it
 * waited for its turn (the same decision as the Wikidata identity bridge: a request still queued at
 * the deadline is local backpressure, whichever timer fires first). A caller cancel while it waits
 * records nothing. A deadline that passes after the dial is a `timeout`; a real upstream throttle is
 * whatever `classifyError` says (`rate_limited`). `request` receives the slot's signal (caller abort
 * or deadline) to pass to the fetch.
 */
export async function observeSlottedProviderRequest<P extends ProviderName, T>(
	input: ObserveProviderRequestInput<P, T>,
	slot: RequestSlot,
	request: (signal: AbortSignal) => Promise<T>
): Promise<T> {
	const { signal, deadlineAtMs } = input.context;
	const observed = beginObservedRequest(input);
	observed?.queued(BUDGET_EXHAUSTED);
	try {
		const value = await slot.run(
			async (runSignal) => {
				observed?.dialed();
				return await request(runSignal);
			},
			{ signal, deadlineAtMs }
		);
		observed?.settle(safeResultOutcome(input, value));
		return value;
	} catch (error) {
		observed?.fail(error, (caught) => classifySlotRefusal(caught) ?? input.classifyError(caught));
		throw error;
	}
}
