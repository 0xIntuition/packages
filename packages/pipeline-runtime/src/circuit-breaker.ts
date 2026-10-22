import { runWithSignal } from './outcome';

export type CircuitState = 'closed' | 'open' | 'half_open';

export type CircuitSnapshot = {
	name: string;
	state: CircuitState;
	failures: number;
	openedAt: string | undefined;
	openForMs: number;
	resetAfterMs: number;
	failureThreshold: number;
};

export class CircuitOpenError extends Error {
	readonly circuitName: string;

	constructor(circuitName: string) {
		super(`Circuit ${circuitName} is open.`);
		this.name = 'CircuitOpenError';
		this.circuitName = circuitName;
	}
}

export class CircuitBreaker {
	private state: CircuitState = 'closed';
	private failures = 0;
	private openedAt: number | undefined;
	private halfOpenInflight = false;
	private generation = 0;

	constructor(
		private readonly input: {
			name: string;
			failureThreshold: number;
			resetAfterMs: number;
			now?: () => number;
			shouldRecordFailure?: (error: unknown) => boolean;
		}
	) {}

	/** Abort is recorded through shouldRecordFailure just like any failed call. */
	async execute<T>(
		run: (signal: AbortSignal) => Promise<T>,
		options: { signal?: AbortSignal } = {}
	): Promise<T> {
		options.signal?.throwIfAborted();
		const generation = this.assertCanRun();
		try {
			const outcome = await runWithSignal(run, { ...options, rejectOnFailure: true });
			this.recordSuccess(generation);
			return outcome.value;
		} catch (error) {
			this.recordError(error, generation);
			throw error;
		}
	}

	snapshot(): CircuitSnapshot {
		const now = this.now();
		return {
			name: this.input.name,
			state: this.state,
			failures: this.failures,
			openedAt: this.openedAt !== undefined ? new Date(this.openedAt).toISOString() : undefined,
			openForMs: this.openedAt !== undefined ? now - this.openedAt : 0,
			resetAfterMs: this.input.resetAfterMs,
			failureThreshold: this.input.failureThreshold,
		};
	}

	/**
	 * Whether a request made now would be refused: the breaker is open inside its
	 * reset window, or half-open with its single probe still in flight. An open
	 * breaker past its reset window is not refusing, because the next request is
	 * admitted as the probe. Read-only: never changes the state.
	 */
	refusesRequests(): boolean {
		if (this.state === 'open') {
			return this.openedAt === undefined || this.now() - this.openedAt < this.input.resetAfterMs;
		}
		return this.state === 'half_open' && this.halfOpenInflight;
	}

	private assertCanRun(): number {
		if (this.state === 'closed') {
			return this.generation;
		}

		if (this.state === 'open') {
			if (this.openedAt === undefined || this.now() - this.openedAt < this.input.resetAfterMs) {
				throw new CircuitOpenError(this.input.name);
			}
			this.state = 'half_open';
			this.failures = 0;
		}

		if (this.halfOpenInflight) {
			throw new CircuitOpenError(this.input.name);
		}
		this.halfOpenInflight = true;
		return this.generation;
	}

	private recordSuccess(admissionGeneration: number): void {
		if (admissionGeneration !== this.generation) {
			return;
		}
		this.state = 'closed';
		this.failures = 0;
		this.openedAt = undefined;
		this.halfOpenInflight = false;
	}

	private recordError(error: unknown, admissionGeneration: number): void {
		if (admissionGeneration !== this.generation) {
			return;
		}
		if (this.input.shouldRecordFailure?.(error) ?? true) {
			this.recordFailure();
		} else {
			this.recordSuccess(admissionGeneration);
		}
	}

	private recordFailure(): void {
		if (this.state === 'half_open') {
			this.failures = 1;
			this.open();
			return;
		}

		this.failures += 1;
		if (this.failures >= this.input.failureThreshold) {
			this.open();
		}
	}

	private open(): void {
		this.state = 'open';
		this.generation += 1;
		this.openedAt = this.now();
		this.halfOpenInflight = false;
	}

	private now(): number {
		return this.input.now?.() ?? Date.now();
	}
}
