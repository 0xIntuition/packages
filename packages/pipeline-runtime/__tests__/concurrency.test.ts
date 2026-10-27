import { setTimeout as sleep } from 'node:timers/promises';
import { describe, expect, it } from 'vitest';
import { forEachBounded } from '../src/concurrency';

describe('forEachBounded', () => {
	it('never exceeds the configured Promise concurrency', async () => {
		let active = 0;
		let maxActive = 0;

		const outcomes = await forEachBounded(
			Array.from({ length: 12 }, (_, index) => index),
			async () => {
				active += 1;
				maxActive = Math.max(maxActive, active);
				await sleep(2);
				active -= 1;
				return 'ok';
			},
			{ concurrency: 3 }
		);

		expect(maxActive).toBe(3);
		expect(outcomes.every((outcome) => outcome.kind === 'success')).toBe(true);
	});

	it('propagates parent cancellation to active item signals', async () => {
		const controller = new AbortController();
		const reason = new Error('stop bounded work');
		const itemSignals: AbortSignal[] = [];

		const result = forEachBounded(
			[1, 2, 3, 4],
			(_item, signal) => {
				itemSignals.push(signal);
				return new Promise<never>((_resolve, reject) => {
					signal.addEventListener('abort', () => reject(signal.reason), { once: true });
				});
			},
			{ concurrency: 2, signal: controller.signal }
		);

		await sleep(1);
		controller.abort(reason);

		await expect(result).rejects.toBe(reason);
		expect(itemSignals).toHaveLength(2);
		expect(itemSignals.every((signal) => signal.aborted)).toBe(true);
	});
});

describe('bounded outcomes', () => {
	it('preserves order, distinguishes throws from rejections, and continues queued work', async () => {
		const error = new Error('callback');
		const result = await forEachBounded(
			[1, 2, 3, 4],
			(item) => {
				if (item === 2) throw error;
				if (item === 3) return Promise.reject(error);
				return sleep(item === 1 ? 10 : 0).then(() => item);
			},
			{ concurrency: 2 }
		);
		expect(result).toEqual([
			{ kind: 'success', value: 1 },
			{ kind: 'defect', error },
			{ kind: 'failure', error },
			{ kind: 'success', value: 4 },
		]);
	});
	it.each([0, -1, NaN, Infinity, 1.9])('normalizes concurrency %s to one', async (concurrency) => {
		let active = 0;
		let max = 0;
		await forEachBounded(
			[1, 2, 3],
			async () => {
				max = Math.max(max, ++active);
				await sleep(1);
				active--;
			},
			{ concurrency }
		);
		expect(max).toBe(1);
	});
	it('skips all work for an already aborted parent and settles an empty iterable', async () => {
		const parent = new AbortController();
		parent.abort('stop');
		let calls = 0;
		await expect(
			forEachBounded(
				[1],
				async () => {
					calls++;
				},
				{ concurrency: 1, signal: parent.signal }
			)
		).rejects.toBe('stop');
		expect(calls).toBe(0);
		expect(await forEachBounded([], async () => 1, { concurrency: 10 })).toEqual([]);
	});
	it('settles cancellation even when active callbacks ignore their signal', async () => {
		const parent = new AbortController();
		let calls = 0;
		const result = forEachBounded(
			[1, 2, 3],
			() => {
				calls++;
				return new Promise<never>(() => {});
			},
			{ concurrency: 2, signal: parent.signal }
		);
		parent.abort('stop');
		await expect(result).rejects.toBe('stop');
		expect(calls).toBe(2);
	});
});
