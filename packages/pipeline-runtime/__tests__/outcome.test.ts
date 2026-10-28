import { describe, expect, it } from 'vitest';
import { runWithSignal, toOutcome, withTimeout } from '../src/outcome';

describe('runWithSignal', () => {
	it('removes every external abort listener after 100 completed runs', async () => {
		const controller = new AbortController();
		const counter = wrapCountingSignal(controller.signal);

		// The wrapper delegates to a real AbortSignal while counting each abort
		// registration/removal pair made by runWithSignal.
		for (let index = 0; index < 100; index += 1) {
			const outcome = await runWithSignal(async () => index, {
				signal: counter.signal,
			});
			expect(outcome).toEqual({ kind: 'success', value: index });
		}

		expect(counter.added()).toBe(100);
		expect(counter.removed()).toBe(100);
		expect(counter.active()).toBe(0);
	});

	it('resolves failures by default and rejects the original error only when opted in', async () => {
		const error = new Error('domain failure');

		await expect(runWithSignal(() => Promise.reject(error))).resolves.toEqual({
			kind: 'failure',
			error,
		});
		await expect(
			runWithSignal(() => Promise.reject(error), { rejectOnFailure: true })
		).rejects.toBe(error);
	});

	it('returns the external abort reason as an interrupted outcome', async () => {
		const controller = new AbortController();
		const reason = new Error('drain stopped');
		const result = runWithSignal(() => new Promise<never>(() => {}), { signal: controller.signal });

		controller.abort(reason);

		await expect(result).resolves.toEqual({ kind: 'interrupted', reason });
	});

	it('does not start a task when the external signal is already aborted', async () => {
		const controller = new AbortController();
		const reason = new Error('already stopped');
		let started = false;
		controller.abort(reason);

		const result = runWithSignal(
			async () => {
				started = true;
			},
			{ signal: controller.signal }
		);

		await expect(result).resolves.toEqual({ kind: 'interrupted', reason });
		expect(started).toBe(false);
	});
});

function wrapCountingSignal(signal: AbortSignal): {
	signal: AbortSignal;
	added: () => number;
	removed: () => number;
	active: () => number;
} {
	let added = 0;
	let removed = 0;
	const activeListeners = new Set<Parameters<AbortSignal['addEventListener']>[1]>();

	const wrapped = {
		get aborted() {
			return signal.aborted;
		},
		get reason() {
			return signal.reason;
		},
		addEventListener(...args: Parameters<AbortSignal['addEventListener']>) {
			const [type, listener] = args;
			if (type === 'abort') {
				added += 1;
				activeListeners.add(listener);
			}
			signal.addEventListener(...args);
		},
		removeEventListener(...args: Parameters<AbortSignal['removeEventListener']>) {
			const [type, listener] = args;
			if (type === 'abort' && activeListeners.delete(listener)) {
				removed += 1;
			}
			signal.removeEventListener(...args);
		},
	} as AbortSignal;

	return {
		signal: wrapped,
		added: () => added,
		removed: () => removed,
		active: () => activeListeners.size,
	};
}

describe('Promise outcome and timeout contract', () => {
	it('separates synchronous defects from returned Promise failures', async () => {
		const error = new Error('failure');
		expect(
			await runWithSignal(() => {
				throw error;
			})
		).toEqual({ kind: 'defect', error });
		expect(toOutcome({ status: 'fulfilled', value: 'ok' })).toEqual({
			kind: 'success',
			value: 'ok',
		});
		expect(toOutcome({ status: 'rejected', reason: error })).toEqual({ kind: 'failure', error });
	});
	it('recognizes private timeouts, aborts underlying work, and refuses forged markers', async () => {
		let child: AbortSignal | undefined;
		const task = withTimeout((signal) => {
			child = signal;
			return new Promise<never>(() => {});
		}, 0);
		expect(await runWithSignal(task)).toEqual({ kind: 'timeout' });
		expect(child?.aborted).toBe(true);
		const forged = Object.assign(new Error('forged'), { name: 'PipelineRuntimeTimeoutError' });
		expect(await runWithSignal(() => Promise.reject(forged))).toEqual({
			kind: 'failure',
			error: forged,
		});
	});
	it('preserves external cancellation through a timeout wrapper', async () => {
		const parent = new AbortController();
		const reason = new Error('stop');
		const result = runWithSignal(
			withTimeout(() => new Promise<never>(() => {}), 60_000),
			{ signal: parent.signal }
		);
		parent.abort(reason);
		expect(await result).toEqual({ kind: 'interrupted', reason });
	});
});
