/** Plain result vocabulary shared with consumer-owned Effect integrations. */
export type Outcome<A, E = unknown> =
	| { kind: 'success'; value: A }
	| { kind: 'timeout' }
	| { kind: 'interrupted'; reason?: unknown }
	| { kind: 'failure'; error: E }
	| { kind: 'defect'; error: unknown };

export type RunWithSignalOptions = {
	signal?: AbortSignal;
	rejectOnFailure?: boolean;
};
export type PromiseTask<A> = (signal: AbortSignal) => Promise<A>;

const timeouts = new WeakSet<object>();

/** Converts a settled Promise; foreign timeout errors remain ordinary failures. */
export function toOutcome<A>(result: PromiseSettledResult<A>): Outcome<A> {
	if (result.status === 'fulfilled') return { kind: 'success', value: result.value };
	return isTimeout(result.reason) ? { kind: 'timeout' } : { kind: 'failure', error: result.reason };
}

function isTimeout(error: unknown): boolean {
	return typeof error === 'object' && error !== null && timeouts.has(error);
}

export function runWithSignal<A>(
	run: PromiseTask<A>,
	options: RunWithSignalOptions & { rejectOnFailure: true }
): Promise<{ kind: 'success'; value: A }>;
export function runWithSignal<A>(
	run: PromiseTask<A>,
	options?: RunWithSignalOptions
): Promise<Outcome<A>>;
/**
 * Sync callback throws are defects; Promise rejections are failures. Cancellation
 * settles promptly, forwards the exact reason, and removes the parent listener.
 * Tasks must observe their signal to stop their underlying I/O.
 */
export async function runWithSignal<A>(
	run: PromiseTask<A>,
	options: RunWithSignalOptions = {}
): Promise<Outcome<A>> {
	const controller = new AbortController();
	const parent = options.signal;
	let finish!: (outcome: Outcome<A>) => void;
	const settled = new Promise<Outcome<A>>((resolve) => {
		finish = resolve;
	});
	const onAbort = () => {
		// Settle before notifying the task, whose listener may reject synchronously.
		finish({ kind: 'interrupted', reason: parent?.reason });
		controller.abort(parent?.reason);
	};
	if (parent?.aborted) onAbort();
	else {
		parent?.addEventListener('abort', onAbort, { once: true });
		try {
			Promise.resolve(run(controller.signal)).then(
				(value) => finish({ kind: 'success', value }),
				(error) => finish(toOutcome({ status: 'rejected', reason: error }))
			);
		} catch (error) {
			finish({ kind: 'defect', error });
		}
	}
	let outcome: Outcome<A>;
	try {
		outcome = await settled;
	} finally {
		parent?.removeEventListener('abort', onAbort);
	}
	if (options.rejectOnFailure && outcome.kind !== 'success') {
		switch (outcome.kind) {
			case 'failure':
			case 'defect':
				throw outcome.error;
			case 'interrupted':
				throw outcome.reason ?? new Error('Pipeline task was interrupted.');
			case 'timeout':
				throw makeTimeout();
		}
	}
	return outcome;
}

function makeTimeout(): Error {
	const error = new Error('Pipeline task timed out.');
	error.name = 'PipelineRuntimeTimeoutError';
	timeouts.add(error);
	return error;
}

/** Returns a lazy Promise task with a private timeout identity and child signal. */
export function withTimeout<A>(run: PromiseTask<A>, timeoutMs: number): PromiseTask<A> {
	return async (signal) => {
		const controller = new AbortController();
		const onAbort = () => controller.abort(signal.reason);
		if (signal.aborted) onAbort();
		else signal.addEventListener('abort', onAbort, { once: true });
		const timer = setTimeout(() => controller.abort(makeTimeout()), Math.max(0, timeoutMs));
		try {
			const outcome = await runWithSignal(run, {
				signal: controller.signal,
				rejectOnFailure: true,
			});
			return outcome.value;
		} finally {
			clearTimeout(timer);
			signal.removeEventListener('abort', onAbort);
		}
	};
}
