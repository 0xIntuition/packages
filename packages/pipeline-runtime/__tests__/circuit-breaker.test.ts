import { describe, expect, it } from 'vitest';
import { CircuitBreaker, CircuitOpenError } from '../src/circuit-breaker';

describe('CircuitBreaker Promise state transitions', () => {
	it('matches Promise threshold, open, half-open, and recovery state', async () => {
		let now = 10;
		const options = {
			name: 'parity-circuit',
			failureThreshold: 2,
			resetAfterMs: 1_000,
			now: () => now,
		};
		const promiseCircuit = new CircuitBreaker(options);
		const nativeCircuit = new CircuitBreaker(options);

		for (let attempt = 1; attempt <= 2; attempt += 1) {
			const promiseError = new Error(`failure-${attempt}`);
			await expect(
				promiseCircuit.execute(async () => {
					throw promiseError;
				})
			).rejects.toBe(promiseError);

			const nativeError = new Error(`failure-${attempt}`);
			await expect(nativeCircuit.execute(() => Promise.reject(nativeError))).rejects.toBe(
				nativeError
			);
		}

		expect(nativeCircuit.snapshot()).toEqual(promiseCircuit.snapshot());
		expect(nativeCircuit.snapshot().state).toBe('open');

		await expect(promiseCircuit.execute(async () => 'blocked')).rejects.toBeInstanceOf(
			CircuitOpenError
		);
		await expect(nativeCircuit.execute(async () => 'blocked')).rejects.toBeInstanceOf(
			CircuitOpenError
		);

		now = 1_011;
		await expect(promiseCircuit.execute(async () => 'recovered')).resolves.toBe('recovered');
		await expect(nativeCircuit.execute(async () => 'recovered')).resolves.toBe('recovered');

		expect(nativeCircuit.snapshot()).toEqual(promiseCircuit.snapshot());
		expect(nativeCircuit.snapshot().state).toBe('closed');
	});

	it('passes the original typed error to shouldRecordFailure', async () => {
		const seen: unknown[] = [];
		const circuit = new CircuitBreaker({
			name: 'predicate-circuit',
			failureThreshold: 1,
			resetAfterMs: 1_000,
			shouldRecordFailure: (error) => {
				seen.push(error);
				return false;
			},
		});
		const error = new Error('ignored');

		await expect(circuit.execute(() => Promise.reject(error))).rejects.toBe(error);

		expect(seen).toEqual([error]);
		expect(circuit.snapshot().state).toBe('closed');
		expect(circuit.snapshot().failures).toBe(0);
	});

	it('ignores a slow success admitted before the circuit opened', async () => {
		let releaseSlowSuccess: ((value: string) => void) | undefined;
		const circuit = new CircuitBreaker({
			name: 'stale-success-circuit',
			failureThreshold: 3,
			resetAfterMs: 1_000,
		});
		const slowSuccess = circuit.execute(
			async () =>
				await new Promise<string>((resolve) => {
					releaseSlowSuccess = resolve;
				})
		);

		for (let attempt = 0; attempt < 3; attempt += 1) {
			await expect(
				circuit.execute(async () => {
					throw new Error(`failure-${attempt}`);
				})
			).rejects.toThrow(`failure-${attempt}`);
		}
		expect(circuit.snapshot().state).toBe('open');

		releaseSlowSuccess?.('late-success');
		await expect(slowSuccess).resolves.toBe('late-success');
		expect(circuit.snapshot().state).toBe('open');
		await expect(circuit.execute(async () => 'blocked')).rejects.toBeInstanceOf(CircuitOpenError);
	});

	it('ignores a slow failure admitted before a later generation closed', async () => {
		let now = 10;
		let rejectSlowFailure: ((error: Error) => void) | undefined;
		const circuit = new CircuitBreaker({
			name: 'stale-failure-circuit',
			failureThreshold: 3,
			resetAfterMs: 1_000,
			now: () => now,
		});
		const slowFailure = circuit.execute(
			async () =>
				await new Promise<never>((_resolve, reject) => {
					rejectSlowFailure = reject;
				})
		);

		for (let attempt = 0; attempt < 3; attempt += 1) {
			await expect(
				circuit.execute(async () => {
					throw new Error(`opening-failure-${attempt}`);
				})
			).rejects.toThrow(`opening-failure-${attempt}`);
		}
		now += 1_000;
		await expect(circuit.execute(async () => 'recovered')).resolves.toBe('recovered');
		expect(circuit.snapshot()).toMatchObject({ state: 'closed', failures: 0 });

		const lateFailure = new Error('late-failure');
		rejectSlowFailure?.(lateFailure);
		await expect(slowFailure).rejects.toBe(lateFailure);
		expect(circuit.snapshot()).toMatchObject({ state: 'closed', failures: 0 });
	});
});

describe('CircuitBreaker cancellation', () => {
	it('does not admit already aborted work', async () => {
		const circuit = new CircuitBreaker({ name: 'abort', failureThreshold: 1, resetAfterMs: 1000 });
		const controller = new AbortController();
		controller.abort('stop');
		let called = false;
		await expect(
			circuit.execute(
				async () => {
					called = true;
				},
				{ signal: controller.signal }
			)
		).rejects.toBe('stop');
		expect(called).toBe(false);
		expect(circuit.snapshot()).toMatchObject({ state: 'closed', failures: 0 });
	});
	it('interrupts a half-open probe, records the exact reason, and ignores its late completion', async () => {
		let now = 0;
		const seen: unknown[] = [];
		const circuit = new CircuitBreaker({
			name: 'abort',
			failureThreshold: 1,
			resetAfterMs: 1000,
			now: () => now,
			shouldRecordFailure: (error) => {
				seen.push(error);
				return true;
			},
		});
		await circuit.execute(() => Promise.reject('opening')).catch(() => {});
		expect(circuit.snapshot().openedAt).toBe(new Date(0).toISOString());
		now = 1000;
		const parent = new AbortController();
		let child: AbortSignal | undefined;
		let release!: () => void;
		const probe = circuit.execute(
			(signal) => {
				child = signal;
				return new Promise<void>((resolve) => {
					release = resolve;
				});
			},
			{ signal: parent.signal }
		);
		expect(circuit.snapshot().state).toBe('half_open');
		parent.abort('stop');
		await expect(probe).rejects.toBe('stop');
		expect(child?.aborted).toBe(true);
		expect(seen).toEqual(['opening', 'stop']);
		expect(circuit.snapshot()).toMatchObject({ state: 'open', failures: 1 });
		release();
		await Promise.resolve();
		expect(circuit.snapshot().state).toBe('open');
	});
});
