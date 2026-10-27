/**
 * A virtual clock for tests of time-based helpers (the request slot). `now` is monotonic ms,
 * `wallNow` epoch ms (a different origin on purpose, so code that mixes the two fails), and
 * `sleep` is a timer that only fires when `advance` moves the clock past it.
 */
export type VirtualClock = {
	now(): number;
	wallNow(): number;
	sleep(ms: number, signal: AbortSignal): Promise<void>;
	/** Moves the clock forward, firing due timers in order and letting their continuations run. */
	advance(ms: number): Promise<void>;
	/** Moves the clock forward WITHOUT firing timers: an event loop that stalled past them. */
	jump(ms: number): void;
	/** Lets pending promise continuations run without moving the clock. */
	flush(): Promise<void>;
	/** Timers that have not fired and were not cancelled. */
	pendingTimers(): number;
	/** Every `sleep` duration requested, in order. */
	sleeps: number[];
};

const WALL_ORIGIN_MS = 1_700_000_000_000;

export function createVirtualClock(): VirtualClock {
	let nowMs = 1_000;
	const timers: Array<{ at: number; fire: () => void }> = [];
	const sleeps: number[] = [];
	const flush = async () => {
		await new Promise((resolve) => setImmediate(resolve));
	};
	return {
		now: () => nowMs,
		wallNow: () => WALL_ORIGIN_MS + nowMs,
		sleeps,
		sleep(ms, signal) {
			sleeps.push(ms);
			return new Promise<void>((resolve, reject) => {
				if (signal.aborted) {
					reject(signal.reason);
					return;
				}
				const timer = {
					at: nowMs + ms,
					fire: () => {
						signal.removeEventListener('abort', onAbort);
						resolve();
					},
				};
				const onAbort = () => {
					const index = timers.indexOf(timer);
					if (index >= 0) timers.splice(index, 1);
					reject(signal.reason);
				};
				timers.push(timer);
				signal.addEventListener('abort', onAbort, { once: true });
			});
		},
		flush,
		jump(ms) {
			nowMs += ms;
		},
		pendingTimers: () => timers.length,
		async advance(ms) {
			const target = nowMs + ms;
			await flush();
			for (;;) {
				const due = timers
					.filter((timer) => timer.at <= target)
					.sort((left, right) => left.at - right.at)[0];
				if (!due) break;
				timers.splice(timers.indexOf(due), 1);
				nowMs = Math.max(nowMs, due.at);
				due.fire();
				await flush();
			}
			nowMs = target;
			await flush();
		},
	};
}
