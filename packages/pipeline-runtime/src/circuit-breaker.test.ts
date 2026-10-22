import { describe, expect, test } from 'vitest';
import { CircuitBreaker } from './circuit-breaker';

function breaker() {
	let nowMs = 1_000_000;
	const instance = new CircuitBreaker({
		name: 'test',
		failureThreshold: 2,
		resetAfterMs: 1000,
		now: () => nowMs,
	});
	return {
		instance,
		advance: (ms: number) => {
			nowMs += ms;
		},
	};
}

const fail = () => Promise.reject(new Error('boom'));

describe('CircuitBreaker.refusesRequests', () => {
	test('is false while closed, including after a failure below the threshold', async () => {
		const { instance } = breaker();
		expect(instance.refusesRequests()).toBe(false);
		await instance.execute(fail).catch(() => undefined);
		expect(instance.snapshot().state).toBe('closed');
		expect(instance.refusesRequests()).toBe(false);
	});

	test('is true while open inside the reset window', async () => {
		const { instance, advance } = breaker();
		for (let index = 0; index < 2; index += 1) await instance.execute(fail).catch(() => undefined);
		expect(instance.snapshot().state).toBe('open');
		expect(instance.refusesRequests()).toBe(true);
		advance(999);
		expect(instance.refusesRequests()).toBe(true);
	});

	test('is false once the reset window passed and the next request would be admitted as the probe', async () => {
		const { instance, advance } = breaker();
		for (let index = 0; index < 2; index += 1) await instance.execute(fail).catch(() => undefined);
		advance(1000);
		expect(instance.refusesRequests()).toBe(false);
	});

	test('is true while half-open with the probe in flight, and false after the probe succeeds', async () => {
		const { instance, advance } = breaker();
		for (let index = 0; index < 2; index += 1) await instance.execute(fail).catch(() => undefined);
		advance(1000);
		let finishProbe: (() => void) | undefined;
		const probe = instance.execute(
			() =>
				new Promise<void>((resolve) => {
					finishProbe = resolve;
				})
		);
		expect(instance.snapshot().state).toBe('half_open');
		expect(instance.refusesRequests()).toBe(true);
		// A concurrent request is refused, which is what the flag reports.
		await expect(instance.execute(async () => 'second')).rejects.toThrow('is open');
		finishProbe?.();
		await probe;
		expect(instance.snapshot().state).toBe('closed');
		expect(instance.refusesRequests()).toBe(false);
	});

	test('is true again when the probe fails and re-opens the breaker', async () => {
		const { instance, advance } = breaker();
		for (let index = 0; index < 2; index += 1) await instance.execute(fail).catch(() => undefined);
		advance(1000);
		await instance.execute(fail).catch(() => undefined);
		expect(instance.snapshot().state).toBe('open');
		expect(instance.refusesRequests()).toBe(true);
	});
});
