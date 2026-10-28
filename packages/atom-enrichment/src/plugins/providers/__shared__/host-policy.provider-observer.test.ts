import { beforeEach, describe, expect, test } from 'bun:test';
import {
	resetHostPolicyForTests,
	runWithHostPolicy,
	trackedHostCountForTests,
} from './host-policy';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

beforeEach(() => resetHostPolicyForTests());

describe('runWithHostPolicy', () => {
	test('starts requests to one host at least the spacing apart, one at a time by default', async () => {
		const starts: number[] = [];
		const run = () =>
			runWithHostPolicy('a.example', { perHostSpacingMs: 120 }, async () => {
				starts.push(Date.now());
				await sleep(10);
			});
		await Promise.all([run(), run(), run()]);
		expect(starts).toHaveLength(3);
		expect((starts[1] ?? 0) - (starts[0] ?? 0)).toBeGreaterThanOrEqual(110);
		expect((starts[2] ?? 0) - (starts[1] ?? 0)).toBeGreaterThanOrEqual(110);
	});

	test('different hosts do not wait for each other', async () => {
		const starts: number[] = [];
		const run = (host: string) =>
			runWithHostPolicy(host, { perHostSpacingMs: 300 }, async () => {
				starts.push(Date.now());
			});
		const began = Date.now();
		await Promise.all([run('a.example'), run('b.example')]);
		expect(Math.max(...starts) - began).toBeLessThan(150);
	});

	test('a caller that is already aborted never waits and never runs', async () => {
		const controller = new AbortController();
		controller.abort(new Error('gone'));
		let ran = false;
		await expect(
			runWithHostPolicy('a.example', { signal: controller.signal }, async () => {
				ran = true;
			})
		).rejects.toThrow('gone');
		expect(ran).toBe(false);
	});

	test('a queued caller that gives up stops waiting at once, and gives its spacing back', async () => {
		const starts: Record<string, number> = {};
		const spacing = 300;
		const first = runWithHostPolicy('a.example', { perHostSpacingMs: spacing }, async () => {
			starts.first = Date.now();
		});
		const controller = new AbortController();
		let cancelledRan = false;
		const began = Date.now();
		const cancelled = runWithHostPolicy(
			'a.example',
			{ perHostSpacingMs: spacing, signal: controller.signal },
			async () => {
				cancelledRan = true;
			}
		);
		const third = runWithHostPolicy('a.example', { perHostSpacingMs: spacing }, async () => {
			starts.third = Date.now();
		});
		setTimeout(() => controller.abort(new Error('cancelled')), 30);
		await expect(cancelled).rejects.toThrow('cancelled');
		// It did not sit out the 300 ms it was queued for.
		expect(Date.now() - began).toBeLessThan(200);
		await Promise.all([first, third]);
		expect(cancelledRan).toBe(false);
		// The abandoned turn did not push the next caller back by a second spacing.
		expect((starts.third ?? 0) - (starts.first ?? 0)).toBeLessThan(spacing * 1.7);
		expect((starts.third ?? 0) - (starts.first ?? 0)).toBeGreaterThanOrEqual(spacing - 20);
	});

	test('a caller that gives up while queued behind a running request does not free its slot', async () => {
		let releaseFirst: () => void = () => undefined;
		const running = { first: false, third: false };
		const first = runWithHostPolicy('a.example', { perHostSpacingMs: 1 }, async () => {
			running.first = true;
			await new Promise<void>((resolve) => {
				releaseFirst = resolve;
			});
			running.first = false;
		});
		await sleep(10);
		const controller = new AbortController();
		const second = runWithHostPolicy(
			'a.example',
			{ perHostSpacingMs: 1, signal: controller.signal },
			async () => undefined
		);
		let thirdSawFirstRunning = true;
		const third = runWithHostPolicy('a.example', { perHostSpacingMs: 1 }, async () => {
			thirdSawFirstRunning = running.first;
			running.third = true;
		});
		controller.abort(new Error('cancelled'));
		await expect(second).rejects.toThrow('cancelled');
		await sleep(40);
		// Concurrency 1: the third still waits for the first, although the second left.
		expect(running.third).toBe(false);
		releaseFirst();
		await Promise.all([first, third]);
		expect(thirdSawFirstRunning).toBe(false);
	});

	test('the map stays bounded under many distinct hosts, and a host still in use is kept', async () => {
		let release: () => void = () => undefined;
		let busyRunning = false;
		const busy = runWithHostPolicy('busy.example', { perHostSpacingMs: 1 }, () => {
			busyRunning = true;
			return new Promise<void>((resolve) => {
				release = resolve;
			});
		});
		await sleep(5);
		let peak = 0;
		for (let i = 0; i < 200; i += 1) {
			await runWithHostPolicy(`host-${i}.example`, { perHostSpacingMs: 1 }, async () => undefined);
			await sleep(2);
			peak = Math.max(peak, trackedHostCountForTests());
		}
		// Idle hosts were swept as the map grew; 200 distinct hosts never stayed tracked.
		expect(peak).toBeLessThanOrEqual(66);
		// The busy host survived every sweep: a second request to it still queues behind the first.
		let secondRanWhileBusy: boolean | undefined;
		const second = runWithHostPolicy('busy.example', { perHostSpacingMs: 1 }, async () => {
			secondRanWhileBusy = busyRunning;
		});
		await sleep(30);
		expect(secondRanWhileBusy).toBeUndefined();
		busyRunning = false;
		release();
		await Promise.all([busy, second]);
		expect(secondRanWhileBusy).toBe(false);
	});

	test('a host still inside its spacing is not forgotten', async () => {
		for (let i = 0; i < 70; i += 1) {
			await runWithHostPolicy(
				`host-${i}.example`,
				{ perHostSpacingMs: 60_000 },
				async () => undefined
			);
		}
		await runWithHostPolicy('later.example', { perHostSpacingMs: 1 }, async () => undefined);
		expect(trackedHostCountForTests()).toBe(71);
	});
});
