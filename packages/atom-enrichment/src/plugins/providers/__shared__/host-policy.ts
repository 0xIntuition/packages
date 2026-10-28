/**
 * Per-host pacing of page fetches: at most `perHostConcurrency` (1 or 2) requests in flight to
 * one hostname, each started at least `perHostSpacingMs` after the previous one. One policy for
 * every page fetch (opengraph's, and microdata's own fallback fetch), so none runs unpaced.
 * State is process-wide, keyed by hostname, and an idle host is forgotten once its spacing has elapsed.
 */
export type HostPolicyOptions = {
	perHostConcurrency?: 1 | 2;
	perHostSpacingMs?: number;
	/** A caller that gives up (cancel, deadline) stops waiting for its turn at once. */
	signal?: AbortSignal | undefined;
};

const DEFAULT_PER_HOST_SPACING_MS = 500;
/** Idle hosts are swept when the map grows past this, so it is bounded by the traffic in flight. */
const SWEEP_AT_SIZE = 64;

type HostState = {
	nextRequestAt: number;
	nextSlot: number;
	slots: Promise<void>[];
	/** Queued plus running requests. */
	inflight: number;
};

const hostStates = new Map<string, HostState>();

function sweepIdleHosts(now: number): void {
	for (const [hostname, state] of hostStates) {
		if (state.inflight === 0 && state.nextRequestAt <= now) hostStates.delete(hostname);
	}
}

function abortError(signal: AbortSignal): unknown {
	return (
		signal.reason ?? Object.assign(new Error('The operation was aborted'), { name: 'AbortError' })
	);
}

/** Resolves with `promise`, or rejects as soon as `signal` aborts (the promise itself is left alone). */
function untilOrAborted<T>(promise: Promise<T>, signal: AbortSignal | undefined): Promise<T> {
	if (!signal) return promise;
	if (signal.aborted) return Promise.reject(abortError(signal));
	return new Promise<T>((resolve, reject) => {
		const onAbort = () => reject(abortError(signal));
		signal.addEventListener('abort', onAbort, { once: true });
		promise.then(
			(value) => {
				signal.removeEventListener('abort', onAbort);
				resolve(value);
			},
			(error) => {
				signal.removeEventListener('abort', onAbort);
				reject(error);
			}
		);
	});
}

export async function runWithHostPolicy<T>(
	hostname: string,
	options: HostPolicyOptions,
	fn: () => Promise<T>
): Promise<T> {
	const concurrency = Math.min(Math.max(options.perHostConcurrency ?? 1, 1), 2);
	const spacingMs = options.perHostSpacingMs ?? DEFAULT_PER_HOST_SPACING_MS;
	if (hostStates.size >= SWEEP_AT_SIZE) sweepIdleHosts(Date.now());
	const state = hostStates.get(hostname) ?? {
		nextRequestAt: 0,
		nextSlot: 0,
		slots: Array.from({ length: concurrency }, () => Promise.resolve()),
		inflight: 0,
	};
	if (state.slots.length !== concurrency) {
		state.slots = Array.from({ length: concurrency }, () => Promise.resolve());
	}
	hostStates.set(hostname, state);
	const slotIndex = state.nextSlot % concurrency;
	state.nextSlot += 1;
	state.inflight += 1;
	const previous = state.slots[slotIndex] ?? Promise.resolve();
	const task = (async () => {
		// The turn is taken in order, but a caller that gives up does not wait for it.
		await untilOrAborted(previous, options.signal);
		const now = Date.now();
		const reservedFrom = state.nextRequestAt;
		const waitMs = Math.max(0, reservedFrom - now);
		const reservedUntil = Math.max(reservedFrom, now) + spacingMs;
		state.nextRequestAt = reservedUntil;
		if (waitMs > 0) {
			try {
				await untilOrAborted(
					new Promise<void>((resolvePromise) => setTimeout(resolvePromise, waitMs)),
					options.signal
				);
			} catch (error) {
				// Never dialled: give the reserved spacing back unless someone queued behind us.
				if (state.nextRequestAt === reservedUntil) state.nextRequestAt = reservedFrom;
				throw error;
			}
		}
		return fn();
	})();
	// The slot frees when the request ahead and this one are both done, so an abandoned wait never
	// lets a third request overlap the one still running.
	state.slots[slotIndex] = Promise.allSettled([previous, task]).then(() => {
		state.inflight -= 1;
	});
	return task;
}

/** Forgets every host (tests only: pacing state is process-wide). */
export function resetHostPolicyForTests(): void {
	hostStates.clear();
}

/** How many hosts are tracked right now (tests only). */
export function trackedHostCountForTests(): number {
	return hostStates.size;
}
