import { CircuitBreaker, CircuitOpenError, type CircuitSnapshot } from './circuit-breaker';
import { normalizeRetryAfterMs, RETRY_AFTER_DEFAULT_MS } from './retry-after';

export const LETTERBOXD_MINIMUM_SPACING_MS = 1_250;
export const LETTERBOXD_403_RETRY_DELAY_MS = RETRY_AFTER_DEFAULT_MS;
export const LETTERBOXD_CIRCUIT_FAILURE_THRESHOLD = 3;
export const LETTERBOXD_CIRCUIT_RESET_AFTER_MS = 5 * 60 * 1_000;

type LetterboxdHostState = {
	blockedUntil: number;
	breaker: CircuitBreaker;
	nextRequestAt: number;
	spacingTail: Promise<void>;
};

const hostStates = new Map<string, LetterboxdHostState>();

export function isLetterboxdHostname(value: string): boolean {
	const hostname = normalizeHostname(value);
	return hostname === 'letterboxd.com' || hostname.endsWith('.letterboxd.com');
}

export class LetterboxdCooldownError extends CircuitOpenError {
	readonly blockedUntil: number;
	readonly reason = 'blocked';
	readonly retryAfterMs: number;

	constructor(hostname: string, blockedUntil: number, nowMs: number) {
		super(`letterboxd:${hostname}`);
		this.name = 'LetterboxdCooldownError';
		this.blockedUntil = blockedUntil;
		this.retryAfterMs = Math.max(0, blockedUntil - nowMs);
		this.message = `Letterboxd host ${hostname} is blocked until ${new Date(blockedUntil).toISOString()} (retryAfterMs=${this.retryAfterMs})`;
	}
}

export async function executeLetterboxdHostRequest<TValue>(
	hostname: string,
	request: () => Promise<TValue>,
	options: {
		now?: () => number;
		signal?: AbortSignal;
		sleep?: (delayMs: number) => Promise<void>;
	} = {}
): Promise<TValue> {
	const normalizedHostname = normalizePolicyHostname(hostname);
	if (!isLetterboxdHostname(normalizedHostname)) {
		throw new Error(`Letterboxd host policy rejected ${normalizedHostname || 'an empty host'}`);
	}

	const state = getHostState(normalizedHostname, options.now);
	const now = options.now ?? Date.now;
	throwIfAborted(options.signal);
	assertNotCoolingDown(normalizedHostname, state, now());
	const releaseReservation = await reserveRequestStart(state, options);
	try {
		throwIfAborted(options.signal);
		assertNotCoolingDown(normalizedHostname, state, now());
		return await state.breaker.execute(() => {
			throwIfAborted(options.signal);
			state.nextRequestAt = now() + LETTERBOXD_MINIMUM_SPACING_MS;
			releaseReservation();
			return request();
		});
	} catch (error) {
		const retryAfterMs = cooldownForError(error);
		if (retryAfterMs !== undefined) {
			state.blockedUntil = Math.max(state.blockedUntil, now() + retryAfterMs);
		}
		throw error;
	} finally {
		releaseReservation();
	}
}

export function getLetterboxdHostCircuitSnapshot(hostname: string): CircuitSnapshot | undefined {
	return hostStates.get(normalizePolicyHostname(hostname))?.breaker.snapshot();
}

export function letterboxdRetryAfterMs(
	status: number,
	upstreamRetryAfterMs?: number
): number | undefined {
	return status === 403 || status === 429 || (status >= 500 && status < 600)
		? normalizeRetryAfterMs(upstreamRetryAfterMs)
		: undefined;
}

export function resetLetterboxdHostPolicyForTests(): void {
	hostStates.clear();
}

function getHostState(hostname: string, now?: () => number): LetterboxdHostState {
	const existing = hostStates.get(hostname);
	if (existing) {
		return existing;
	}

	const state: LetterboxdHostState = {
		blockedUntil: 0,
		breaker: new CircuitBreaker({
			name: `letterboxd:${hostname}`,
			failureThreshold: LETTERBOXD_CIRCUIT_FAILURE_THRESHOLD,
			resetAfterMs: LETTERBOXD_CIRCUIT_RESET_AFTER_MS,
			...(now ? { now } : {}),
			shouldRecordFailure: isRecordableLetterboxdFailure,
		}),
		nextRequestAt: 0,
		spacingTail: Promise.resolve(),
	};
	hostStates.set(hostname, state);
	return state;
}

function assertNotCoolingDown(hostname: string, state: LetterboxdHostState, nowMs: number): void {
	if (state.blockedUntil > nowMs) {
		throw new LetterboxdCooldownError(hostname, state.blockedUntil, nowMs);
	}
}

function cooldownForError(error: unknown): number | undefined {
	if (typeof error !== 'object' || error === null) {
		return undefined;
	}
	const candidate = error as { retryAfterMs?: unknown; status?: unknown };
	if (
		typeof candidate.status !== 'number' ||
		(candidate.status !== 403 &&
			candidate.status !== 429 &&
			!(candidate.status >= 500 && candidate.status < 600))
	) {
		return undefined;
	}
	return normalizeRetryAfterMs(candidate.retryAfterMs);
}

async function reserveRequestStart(
	state: LetterboxdHostState,
	options: {
		now?: () => number;
		signal?: AbortSignal;
		sleep?: (delayMs: number) => Promise<void>;
	}
): Promise<() => void> {
	const previousReservation = state.spacingTail;
	let predecessorPassed = false;
	let releaseReservation: () => void = () => undefined;
	state.spacingTail = new Promise<void>((resolve) => {
		releaseReservation = resolve;
	});

	let released = false;
	const release = () => {
		if (!released) {
			released = true;
			releaseReservation();
		}
	};

	try {
		await waitForAdmission(previousReservation, options.signal);
		predecessorPassed = true;
		throwIfAborted(options.signal);
		const now = options.now ?? Date.now;
		const sleep = options.sleep ?? defaultSleep;
		const delayMs = Math.max(0, state.nextRequestAt - now());
		if (delayMs > 0) {
			await waitForAdmission(sleep(delayMs), options.signal);
		}
		throwIfAborted(options.signal);
		return release;
	} catch (error) {
		if (predecessorPassed) {
			release();
		} else {
			previousReservation.then(release, release);
		}
		throw error;
	}
}

async function waitForAdmission(promise: Promise<void>, signal: AbortSignal | undefined) {
	if (!signal) {
		await promise;
		return;
	}
	throwIfAborted(signal);
	await new Promise<void>((resolve, reject) => {
		const onAbort = () => {
			cleanup();
			reject(signal.reason ?? new Error('Letterboxd admission aborted'));
		};
		const cleanup = () => signal.removeEventListener('abort', onAbort);
		signal.addEventListener('abort', onAbort, { once: true });
		promise.then(
			() => {
				cleanup();
				resolve();
			},
			(error) => {
				cleanup();
				reject(error);
			}
		);
	});
}

function throwIfAborted(signal: AbortSignal | undefined): void {
	if (signal?.aborted) {
		throw signal.reason ?? new Error('Letterboxd admission aborted');
	}
}

function isRecordableLetterboxdFailure(error: unknown): boolean {
	if (typeof error !== 'object' || error === null) {
		return false;
	}

	const candidate = error as { reason?: unknown; status?: unknown };
	if (
		candidate.reason === 'waf_challenge' ||
		candidate.reason === 'timeout' ||
		candidate.reason === 'dns_failure'
	) {
		return true;
	}

	return (
		typeof candidate.status === 'number' &&
		(candidate.status === 403 ||
			candidate.status === 429 ||
			(candidate.status >= 500 && candidate.status < 600))
	);
}

async function defaultSleep(delayMs: number): Promise<void> {
	await new Promise<void>((resolve) => setTimeout(resolve, delayMs));
}

function normalizeHostname(value: string): string {
	return value.trim().toLowerCase().replace(/\.+$/, '');
}

function normalizePolicyHostname(value: string): string {
	const hostname = normalizeHostname(value);
	return isLetterboxdHostname(hostname) ? 'letterboxd.com' : hostname;
}
