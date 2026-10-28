import { readBoundedResponseText } from '@0xintuition/pipeline-runtime/bounded-text';
import {
	CircuitBreaker,
	CircuitOpenError,
	type CircuitSnapshot,
} from '@0xintuition/pipeline-runtime/circuit-breaker';
import type { PipelineErrorKind } from '@0xintuition/pipeline-runtime/errors';
import {
	executeLetterboxdHostRequest,
	getLetterboxdHostCircuitSnapshot,
	isLetterboxdHostname,
	letterboxdRetryAfterMs,
	resetLetterboxdHostPolicyForTests,
} from '@0xintuition/pipeline-runtime/letterboxd';
import { parseRetryAfterMs } from '@0xintuition/pipeline-runtime/retry-after';
import { isImdbHostname } from '../../imdb/url';

export type DomainHtmlFetchLike = (
	input: string,
	init?: {
		method?: string;
		headers?: Record<string, string>;
		body?: string;
		redirect?: 'follow' | 'manual' | 'error';
		signal?: AbortSignal;
		connection?: DomainHtmlConnection;
	}
) => Promise<{
	ok: boolean;
	status: number;
	headers?: {
		get(name: string): string | null;
	};
	body?: {
		getReader(): {
			read(): Promise<{ done: boolean; value?: Uint8Array }>;
			cancel(reason?: unknown): Promise<void>;
			releaseLock?(): void;
		};
	} | null;
	text(): Promise<string>;
}>;

export type DomainHtmlResolvedAddress = {
	address: string;
	family: 4 | 6;
};

export type DomainHtmlConnection = DomainHtmlResolvedAddress & {
	hostname: string;
};

export type DomainHtmlResolveHostname = (
	hostname: string
) => Promise<readonly DomainHtmlResolvedAddress[]>;

export type DomainHtmlFetchFailureReason = PipelineErrorKind;

export type DomainHtmlCircuitContext = {
	hostname: string;
	snapshot: CircuitSnapshot;
};

export type DomainHtmlFetchFailure = {
	kind: PipelineErrorKind;
	reason: DomainHtmlFetchFailureReason;
	status?: number;
	retryAfterMs?: number;
	circuit?: DomainHtmlCircuitContext;
};

export type DomainHtmlResult<TValue> =
	| { ok: true; value: TValue }
	| { ok: false; failure: DomainHtmlFetchFailure };

export type DomainHtmlDocumentResult = DomainHtmlResult<string>;

export class DomainHtmlFetchError extends Error {
	readonly reason: DomainHtmlFetchFailureReason;
	readonly status: number | undefined;
	readonly retryAfterMs: number | undefined;
	readonly kind: PipelineErrorKind;
	readonly circuit: DomainHtmlCircuitContext | undefined;

	constructor(failure: DomainHtmlFetchFailure, url?: string) {
		super(formatDomainHtmlFetchFailureMessage(failure, url));
		this.name = 'DomainHtmlFetchError';
		this.kind = failure.kind;
		this.reason = failure.reason;
		this.status = failure.status;
		this.retryAfterMs = failure.retryAfterMs;
		this.circuit = failure.circuit;
	}
}

export const DEFAULT_DOMAIN_FETCH_TIMEOUT_MS = 5000;
export const HOST_CIRCUIT_BREAKER_FAILURE_THRESHOLD = 3;
export const HOST_CIRCUIT_BREAKER_RESET_AFTER_MS = 5 * 60 * 1000;
export const HOST_CIRCUIT_BREAKER_MAX_HOSTS = 256;
export const HOST_FETCH_BUDGET_MS: ReadonlyMap<string, number> = new Map([
	['goodreads.com', 2000],
	['www.goodreads.com', 2000],
]);

const hostCircuitBreakers = new Map<string, CircuitBreaker>();
const DEFAULT_MAX_RESPONSE_BYTES = 1024 * 1024;
const MAX_REDIRECTS = 5;
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);
const PUBLIC_REDIRECT_HEADER_NAMES = new Set(['accept', 'accept-language', 'user-agent']);

type AbsoluteDeadline = {
	deadlineAtMs: number;
	markTimedOut: () => void;
	now: () => number;
};

export const DEFAULT_BROWSER_REQUEST_HEADERS = {
	accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
	'accept-language': 'en-US,en;q=0.9',
	'user-agent':
		'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
} as const;

/**
 * The default transport is intentionally server-only: it requires a Node/Bun
 * runtime so it can dial the validated address while preserving HTTP Host and
 * TLS SNI. Custom transports must honor `init.connection`; do not replace this
 * boundary with an unpinned `globalThis.fetch` for untrusted URLs.
 */
export function resolveDomainHtmlFetch(
	fetcher: DomainHtmlFetchLike | undefined
): DomainHtmlFetchLike {
	if (fetcher) {
		return fetcher;
	}

	return fetchWithPinnedNodeTransport;
}

export async function fetchHtmlDocumentResult(
	fetcher: DomainHtmlFetchLike,
	input: {
		url: string;
		acceptFinalUrl?: (url: string) => boolean;
		bodyLimitReason?: 'body_limit' | 'body_read_failure';
		rejectedRedirectReason?: 'redirect_rejected';
		deadlineAtMs?: number;
		headers?: Record<string, string>;
		signal?: AbortSignal;
		timeoutMs?: number;
		now?: () => number;
		maxResponseBytes?: number;
		resolveHostname?: DomainHtmlResolveHostname;
	}
): Promise<DomainHtmlDocumentResult> {
	return await fetchPublicHttpTextResult(fetcher, {
		...input,
		headers: {
			...DEFAULT_BROWSER_REQUEST_HEADERS,
			...(input.headers ?? {}),
		},
	});
}

export async function fetchJsonDocumentResult<TValue>(
	fetcher: DomainHtmlFetchLike,
	input: {
		url: string;
		acceptFinalUrl?: (url: string) => boolean;
		bodyLimitReason?: 'body_limit' | 'body_read_failure';
		rejectedRedirectReason?: 'redirect_rejected';
		deadlineAtMs?: number;
		headers?: Record<string, string>;
		signal?: AbortSignal;
		timeoutMs?: number;
		now?: () => number;
		maxResponseBytes?: number;
		resolveHostname?: DomainHtmlResolveHostname;
	}
): Promise<DomainHtmlResult<TValue>> {
	const textResult = await fetchPublicHttpTextResult(fetcher, {
		...input,
		headers: {
			accept: 'application/json,text/plain;q=0.9,*/*;q=0.8',
			'user-agent': DEFAULT_BROWSER_REQUEST_HEADERS['user-agent'],
			...(input.headers ?? {}),
		},
	});
	if (textResult.ok === false) {
		return { ok: false, failure: textResult.failure };
	}

	try {
		return { ok: true, value: JSON.parse(textResult.value) as TValue };
	} catch {
		return failureResult('parse_failure');
	}
}

export async function resolvePublicHttpUrlResult(
	fetcher: DomainHtmlFetchLike,
	input: {
		url: string;
		headers?: Record<string, string>;
		signal?: AbortSignal;
		timeoutMs?: number;
		now?: () => number;
		resolveHostname?: DomainHtmlResolveHostname;
		acceptDestination?: (url: string) => boolean;
	}
): Promise<DomainHtmlResult<string>> {
	const { acceptDestination, ...requestInput } = input;
	return await fetchPublicHttpResource(
		fetcher,
		{
			...requestInput,
			headers: {
				...DEFAULT_BROWSER_REQUEST_HEADERS,
				...(input.headers ?? {}),
			},
			...(acceptDestination
				? {
						resolveRedirectDestination: (url: string) => (acceptDestination(url) ? url : undefined),
					}
				: {}),
		},
		async (response, finalUrl, signal, deadline) => {
			if (isAbsoluteDeadlineExpired(deadline)) {
				return failureResult('timeout');
			}
			await cancelResponseBody(response, signal);
			return { ok: true, value: finalUrl };
		}
	);
}

export function isSafePublicHttpUrl(value: string): boolean {
	let parsed: URL;
	try {
		parsed = new URL(value);
	} catch {
		return false;
	}

	if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
		return false;
	}
	if (parsed.username || parsed.password) {
		return false;
	}

	const hostname = normalizeHostname(parsed.hostname);
	if (!hostname || isImdbHostname(hostname)) {
		return false;
	}
	if (isIPv4Address(hostname)) {
		return !isBlockedIPv4Address(hostname);
	}
	if (hostname.includes(':')) {
		return !isBlockedIPv6Address(hostname);
	}
	if (isInternalHostname(hostname)) {
		return false;
	}

	return true;
}

async function fetchPublicHttpTextResult(
	fetcher: DomainHtmlFetchLike,
	input: {
		url: string;
		acceptFinalUrl?: (url: string) => boolean;
		bodyLimitReason?: 'body_limit' | 'body_read_failure';
		rejectedRedirectReason?: 'redirect_rejected';
		deadlineAtMs?: number;
		headers: Record<string, string>;
		signal?: AbortSignal;
		timeoutMs?: number;
		now?: () => number;
		maxResponseBytes?: number;
		resolveHostname?: DomainHtmlResolveHostname;
	}
): Promise<DomainHtmlDocumentResult> {
	return await fetchPublicHttpResource(
		fetcher,
		input,
		async (response, finalUrl, signal, deadline) => {
			if (input.acceptFinalUrl && !input.acceptFinalUrl(finalUrl)) {
				if (isAbsoluteDeadlineExpired(deadline)) {
					return failureResult('timeout');
				}
				await cancelResponseBody(response, signal);
				return failureResult('redirect_exhausted');
			}
			if (isAbsoluteDeadlineExpired(deadline)) {
				return failureResult('timeout');
			}
			return await readBoundedResponseTextResult(
				response,
				input.maxResponseBytes ?? DEFAULT_MAX_RESPONSE_BYTES,
				signal,
				input.bodyLimitReason ?? 'body_read_failure'
			);
		}
	);
}

async function fetchPublicHttpResource<TResult>(
	fetcher: DomainHtmlFetchLike,
	input: {
		url: string;
		acceptFinalUrl?: (url: string) => boolean;
		rejectedRedirectReason?: 'redirect_rejected';
		deadlineAtMs?: number;
		headers: Record<string, string>;
		signal?: AbortSignal;
		timeoutMs?: number;
		now?: () => number;
		resolveHostname?: DomainHtmlResolveHostname;
		resolveRedirectDestination?: (url: string) => TResult | undefined;
	},
	resolveResponse: (
		response: Awaited<ReturnType<DomainHtmlFetchLike>>,
		finalUrl: string,
		signal: AbortSignal,
		deadline: AbsoluteDeadline | undefined
	) => Promise<DomainHtmlResult<TResult>>
): Promise<DomainHtmlResult<TResult>> {
	let currentUrl = input.url;
	let requestHeaders = input.headers;
	const visitedUrls = new Set<string>();
	const chainAbort =
		input.deadlineAtMs === undefined
			? undefined
			: createBoundedAbortSignal(
					input.signal,
					Math.max(0, input.deadlineAtMs - (input.now?.() ?? Date.now()))
				);
	const absoluteDeadline =
		chainAbort && input.deadlineAtMs !== undefined
			? {
					deadlineAtMs: input.deadlineAtMs,
					markTimedOut: chainAbort.markTimedOut,
					now: input.now ?? Date.now,
				}
			: undefined;
	if (chainAbort?.didTimeout() || isAbsoluteDeadlineExpired(absoluteDeadline)) {
		chainAbort?.cleanup();
		return failureResult('timeout');
	}

	try {
		for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
			if (isAbsoluteDeadlineExpired(absoluteDeadline)) {
				return failureResult('timeout');
			}
			if (visitedUrls.has(currentUrl)) {
				return failureResult('redirect_exhausted');
			}
			visitedUrls.add(currentUrl);
			if (
				redirectCount > 0 &&
				input.rejectedRedirectReason &&
				input.acceptFinalUrl &&
				!input.acceptFinalUrl(currentUrl)
			) {
				return failureResult(input.rejectedRedirectReason);
			}
			const hostname = hostnameFromUrl(currentUrl);
			if (!hostname) {
				return failureResult('ssrf_rejected');
			}
			if (isEmbargoedTmdbHostname(hostname) || isImdbHostname(hostname)) {
				return failureResult('embargoed_host');
			}

			const usesLetterboxdPolicy = isLetterboxdHostname(hostname);
			const breaker = usesLetterboxdPolicy ? undefined : getHostCircuitBreaker(hostname, input.now);
			const hopAbort =
				chainAbort ??
				createBoundedAbortSignal(
					input.signal,
					HOST_FETCH_BUDGET_MS.get(hostname) ?? input.timeoutMs ?? DEFAULT_DOMAIN_FETCH_TIMEOUT_MS
				);
			try {
				const executeHop = async () => {
					const result = await fetchPublicHttpHop(
						fetcher,
						{
							currentUrl,
							redirectCount,
							requestHeaders,
							deadline: absoluteDeadline,
							resolveHostname: input.resolveHostname,
							resolveRedirectDestination: input.resolveRedirectDestination,
							signal: hopAbort.signal,
							timedOut: hopAbort.didTimeout,
						},
						resolveResponse
					);
					if (
						result.kind === 'complete' &&
						result.result.ok === false &&
						shouldRecordHostFailure(result.result.failure)
					) {
						throw new DomainHtmlFetchError(result.result.failure, currentUrl);
					}
					return result;
				};
				const hop = usesLetterboxdPolicy
					? await executeLetterboxdHostRequest(hostname, executeHop, {
							now: input.now,
							signal: hopAbort.signal,
						})
					: await breaker?.execute(executeHop);
				if (!hop) {
					return failureResult('adapter_error');
				}

				if (hop.kind === 'complete') {
					return hop.result;
				}
				currentUrl = hop.nextUrl;
				requestHeaders = hop.requestHeaders;
			} catch (error) {
				if (hopAbort.signal.aborted) {
					return failureResult(hopAbort.didTimeout() ? 'timeout' : 'adapter_error');
				}
				if (error instanceof CircuitOpenError) {
					const snapshot = usesLetterboxdPolicy
						? getLetterboxdHostCircuitSnapshot(hostname)
						: breaker?.snapshot();
					return failureResult('circuit_open', 'circuit_open', undefined, {
						hostname,
						snapshot: snapshot ?? {
							name: `domain-html:${hostname}`,
							state: 'open',
							failures: 3,
							openedAt: undefined,
							openForMs: 0,
							resetAfterMs: HOST_CIRCUIT_BREAKER_RESET_AFTER_MS,
							failureThreshold: HOST_CIRCUIT_BREAKER_FAILURE_THRESHOLD,
						},
					});
				}
				if (error instanceof DomainHtmlFetchError) {
					return { ok: false, failure: domainHtmlFailureFromError(error) };
				}
				return failureResult('adapter_error');
			} finally {
				if (!chainAbort) {
					hopAbort.cleanup();
				}
			}
		}

		return failureResult('redirect_exhausted');
	} finally {
		chainAbort?.cleanup();
	}
}

async function fetchPublicHttpHop<TResult>(
	fetcher: DomainHtmlFetchLike,
	input: {
		currentUrl: string;
		redirectCount: number;
		requestHeaders: Record<string, string>;
		deadline: AbsoluteDeadline | undefined;
		signal: AbortSignal;
		timedOut: () => boolean;
		resolveHostname?: DomainHtmlResolveHostname;
		resolveRedirectDestination?: (url: string) => TResult | undefined;
	},
	resolveResponse: (
		response: Awaited<ReturnType<DomainHtmlFetchLike>>,
		finalUrl: string,
		signal: AbortSignal,
		deadline: AbsoluteDeadline | undefined
	) => Promise<DomainHtmlResult<TResult>>
): Promise<
	| { kind: 'complete'; result: DomainHtmlResult<TResult> }
	| { kind: 'redirect'; nextUrl: string; requestHeaders: Record<string, string> }
> {
	try {
		if (isAbsoluteDeadlineExpired(input.deadline)) {
			return { kind: 'complete', result: failureResult('timeout') };
		}
		const destinationResult = await resolveSafePublicHttpDestination(
			input.currentUrl,
			input.resolveHostname ?? resolveHostnameWithNodeDns,
			input.signal
		);
		if (destinationResult.ok === false) {
			return { kind: 'complete', result: destinationResult };
		}
		if (isAbsoluteDeadlineExpired(input.deadline)) {
			return { kind: 'complete', result: failureResult('timeout') };
		}
		const destination = destinationResult.value;
		throwIfAborted(input.signal);
		const acceptedDestination =
			input.redirectCount > 0 ? input.resolveRedirectDestination?.(input.currentUrl) : undefined;
		if (acceptedDestination !== undefined) {
			return { kind: 'complete', result: { ok: true, value: acceptedDestination } };
		}
		if (isAbsoluteDeadlineExpired(input.deadline)) {
			return { kind: 'complete', result: failureResult('timeout') };
		}

		const response = await waitForOperation(
			fetcher(input.currentUrl, {
				connection: destination.connection,
				headers: input.requestHeaders,
				redirect: 'manual',
				signal: input.signal,
			}),
			input.signal
		);
		if (isAbsoluteDeadlineExpired(input.deadline)) {
			return { kind: 'complete', result: failureResult('timeout') };
		}
		if (!REDIRECT_STATUSES.has(response.status)) {
			const wafAction = response.headers?.get('x-amzn-waf-action')?.trim().toLowerCase();
			if (wafAction === 'challenge' && (response.status === 202 || !response.ok)) {
				await cancelResponseBody(response, input.signal);
				return {
					kind: 'complete',
					result: failureResult('non_ok_status', 'waf_challenge', response.status),
				};
			}
			if (!response.ok) {
				await cancelResponseBody(response, input.signal);
				return {
					kind: 'complete',
					result: failureResult(
						'non_ok_status',
						'http_error',
						response.status,
						undefined,
						isLetterboxdHostname(destination.connection.hostname)
							? letterboxdRetryAfterMs(
									response.status,
									parseRetryAfterMs(response.headers?.get('retry-after'))
								)
							: undefined
					),
				};
			}

			return {
				kind: 'complete',
				result: await resolveResponse(response, input.currentUrl, input.signal, input.deadline),
			};
		}

		const location = response.headers?.get('location');
		await cancelResponseBody(response, input.signal);
		if (!location || input.redirectCount === MAX_REDIRECTS) {
			return { kind: 'complete', result: failureResult('redirect_exhausted') };
		}

		try {
			const nextUrl = new URL(location, input.currentUrl);
			return {
				kind: 'redirect',
				nextUrl: nextUrl.toString(),
				requestHeaders:
					nextUrl.origin === new URL(input.currentUrl).origin
						? input.requestHeaders
						: retainPublicRedirectHeaders(input.requestHeaders),
			};
		} catch {
			return { kind: 'complete', result: failureResult('redirect_exhausted') };
		}
	} catch (error) {
		if (input.signal.aborted) {
			return {
				kind: 'complete',
				result: failureResult(input.timedOut() ? 'timeout' : 'adapter_error'),
			};
		}
		return {
			kind: 'complete',
			result:
				error instanceof DomainHtmlFetchError
					? { ok: false, failure: domainHtmlFailureFromError(error) }
					: failureResult('adapter_error'),
		};
	}
}

function getHostCircuitBreaker(hostname: string, now?: () => number): CircuitBreaker {
	const existing = hostCircuitBreakers.get(hostname);
	if (existing) {
		hostCircuitBreakers.delete(hostname);
		hostCircuitBreakers.set(hostname, existing);
		return existing;
	}

	if (hostCircuitBreakers.size >= HOST_CIRCUIT_BREAKER_MAX_HOSTS) {
		const oldestHostname = hostCircuitBreakers.keys().next().value;
		if (oldestHostname !== undefined) {
			hostCircuitBreakers.delete(oldestHostname);
		}
	}

	const breaker = new CircuitBreaker({
		name: `domain-html:${hostname}`,
		failureThreshold: HOST_CIRCUIT_BREAKER_FAILURE_THRESHOLD,
		resetAfterMs: HOST_CIRCUIT_BREAKER_RESET_AFTER_MS,
		...(now ? { now } : {}),
		shouldRecordFailure: (error) =>
			error instanceof DomainHtmlFetchError &&
			shouldRecordHostFailure(domainHtmlFailureFromError(error)),
	});
	hostCircuitBreakers.set(hostname, breaker);
	return breaker;
}

function shouldRecordHostFailure(failure: DomainHtmlFetchFailure): boolean {
	if (
		failure.reason === 'waf_challenge' ||
		failure.reason === 'timeout' ||
		failure.reason === 'dns_failure'
	) {
		return true;
	}

	return (
		(failure.kind === 'http_error' ||
			failure.kind === 'non_ok_status' ||
			failure.reason === 'http_error' ||
			failure.reason === 'non_ok_status') &&
		failure.status !== undefined &&
		(failure.status === 403 ||
			failure.status === 429 ||
			(failure.status >= 500 && failure.status < 600))
	);
}

function hostnameFromUrl(value: string): string | undefined {
	try {
		return normalizeHostname(new URL(value).hostname) || undefined;
	} catch {
		return undefined;
	}
}

function isEmbargoedTmdbHostname(hostname: string): boolean {
	return (
		hostname === 'themoviedb.org' ||
		hostname.endsWith('.themoviedb.org') ||
		hostname === 'tmdb.org' ||
		hostname.endsWith('.tmdb.org')
	);
}

function formatDomainHtmlFetchFailureMessage(
	failure: DomainHtmlFetchFailure,
	url: string | undefined
): string {
	if (failure.kind !== 'circuit_open' && failure.reason !== 'circuit_open') {
		const message =
			failure.status === undefined ? failure.reason : `${failure.reason}: HTTP ${failure.status}`;
		return failure.retryAfterMs === undefined
			? message
			: `${message} (retryAfterMs=${failure.retryAfterMs})`;
	}

	const hostname = failure.circuit?.hostname ?? (url ? hostnameFromUrl(url) : undefined);
	const snapshot =
		failure.circuit?.snapshot ??
		(hostname ? hostCircuitBreakers.get(hostname)?.snapshot() : undefined);
	return hostname && snapshot
		? `circuit_open: Host ${hostname} circuit is ${snapshot.state} (failures=${snapshot.failures}, openForMs=${snapshot.openForMs}, resetAfterMs=${snapshot.resetAfterMs})`
		: 'circuit_open: Host circuit is open';
}

/**
 * Read-only breaker state for metrics: true while requests to the host are being
 * refused (open inside the reset window, or half-open with its probe in flight).
 * Never creates a breaker.
 */
export function getDomainHtmlHostCircuitOpen(hostname: string): boolean {
	return hostCircuitBreakers.get(normalizeHostname(hostname))?.refusesRequests() ?? false;
}

export function resetDomainHtmlHostCircuitBreakersForTests(): void {
	hostCircuitBreakers.clear();
	resetLetterboxdHostPolicyForTests();
}

async function resolveSafePublicHttpDestination(
	value: string,
	resolveHostname: DomainHtmlResolveHostname,
	signal: AbortSignal
): Promise<DomainHtmlResult<{ connection: DomainHtmlConnection }>> {
	if (!isSafePublicHttpUrl(value)) {
		return failureResult('ssrf_rejected');
	}

	const parsed = new URL(value);
	const hostname = normalizeHostname(parsed.hostname);
	const literalFamily = getIpAddressFamily(hostname);
	if (literalFamily) {
		return {
			ok: true,
			value: {
				connection: {
					address: hostname,
					family: literalFamily,
					hostname,
				},
			},
		};
	}

	let addresses: readonly DomainHtmlResolvedAddress[];
	try {
		addresses = await waitForOperation(resolveHostname(hostname), signal);
	} catch {
		throwIfAborted(signal);
		return failureResult('dns_failure');
	}
	if (addresses.length === 0) {
		return failureResult('dns_failure');
	}

	const validatedAddresses = addresses.flatMap((entry) => {
		const family = getIpAddressFamily(normalizeHostname(entry.address));
		return family === entry.family && isSafePublicIpAddress(entry.address)
			? [{ address: normalizeHostname(entry.address), family }]
			: [];
	});
	if (validatedAddresses.length !== addresses.length) {
		return failureResult('ssrf_rejected');
	}

	throwIfAborted(signal);
	const selectedAddress =
		validatedAddresses.find(({ family }) => family === 4) ?? validatedAddresses[0];
	if (!selectedAddress) {
		return failureResult('dns_failure');
	}

	return {
		ok: true,
		value: {
			connection: {
				...selectedAddress,
				hostname,
			},
		},
	};
}

async function resolveHostnameWithNodeDns(
	hostname: string
): Promise<readonly DomainHtmlResolvedAddress[]> {
	const { lookup } = await import('node:dns/promises');
	const addresses = await lookup(hostname, { all: true, verbatim: true });
	return addresses.flatMap((entry) =>
		entry.family === 4 || entry.family === 6
			? [{ address: entry.address, family: entry.family }]
			: []
	);
}

function isSafePublicIpAddress(address: string): boolean {
	const normalized = normalizeHostname(address);
	if (isIPv4Address(normalized)) {
		return !isBlockedIPv4Address(normalized);
	}
	if (normalized.includes(':')) {
		return !isBlockedIPv6Address(normalized);
	}
	return false;
}

async function readBoundedResponseTextResult(
	response: Awaited<ReturnType<DomainHtmlFetchLike>>,
	maxResponseBytes: number,
	signal: AbortSignal,
	bodyLimitReason: 'body_limit' | 'body_read_failure'
): Promise<DomainHtmlDocumentResult> {
	try {
		const result = await readBoundedResponseText(response, {
			maxBytes: maxResponseBytes,
			signal,
		});
		// Explicit discriminant comparison: consumers compiled without
		// `strictNullChecks` (backend/atom-services) do not narrow on truthiness.
		if (result.ok === false) {
			return failureResult(result.reason === 'body_limit' ? bodyLimitReason : result.reason);
		}
		return result;
	} catch {
		throwIfAborted(signal);
		return failureResult('body_read_failure');
	}
}

async function cancelResponseBody(
	response: Awaited<ReturnType<DomainHtmlFetchLike>>,
	signal: AbortSignal
): Promise<void> {
	if (!response.body) {
		return;
	}

	const reader = response.body.getReader();
	try {
		await cancelReader(reader, signal, 'Domain fetch response was not consumed');
	} finally {
		reader.releaseLock?.();
	}
}

async function cancelReader(
	reader: ReturnType<NonNullable<Awaited<ReturnType<DomainHtmlFetchLike>>['body']>['getReader']>,
	signal: AbortSignal,
	reason: string
): Promise<void> {
	try {
		await waitForOperation(reader.cancel(new Error(reason)), signal);
	} catch {
		// Cancellation has been issued. The request deadline bounds how long cleanup
		// may delay classification if a custom stream does not settle its promise.
	}
}

function createBoundedAbortSignal(
	externalSignal: AbortSignal | undefined,
	timeoutMs = DEFAULT_DOMAIN_FETCH_TIMEOUT_MS
): {
	signal: AbortSignal;
	cleanup: () => void;
	didTimeout: () => boolean;
	markTimedOut: () => void;
} {
	const controller = new AbortController();
	let timedOut = false;
	const markTimedOut = () => {
		timedOut = true;
		controller.abort(new Error('Domain fetch timed out'));
	};
	const abortFromExternalSignal = () => controller.abort(externalSignal?.reason);
	if (externalSignal?.aborted) {
		abortFromExternalSignal();
	} else {
		externalSignal?.addEventListener('abort', abortFromExternalSignal, { once: true });
	}

	let timer: ReturnType<typeof setTimeout> | undefined;
	if (timeoutMs <= 0) {
		markTimedOut();
	} else {
		timer = setTimeout(markTimedOut, timeoutMs);
	}
	return {
		signal: controller.signal,
		didTimeout: () => timedOut,
		markTimedOut,
		cleanup: () => {
			if (timer !== undefined) {
				clearTimeout(timer);
			}
			externalSignal?.removeEventListener('abort', abortFromExternalSignal);
		},
	};
}

function isAbsoluteDeadlineExpired(deadline: AbsoluteDeadline | undefined): boolean {
	if (!deadline || deadline.deadlineAtMs - deadline.now() > 0) {
		return false;
	}
	deadline.markTimedOut();
	return true;
}

function failureResult(
	kind: PipelineErrorKind,
	reason: DomainHtmlFetchFailureReason = kind,
	status?: number,
	circuit?: DomainHtmlCircuitContext,
	retryAfterMs?: number
): { ok: false; failure: DomainHtmlFetchFailure } {
	const failure: DomainHtmlFetchFailure = {
		kind,
		reason,
		...(status === undefined ? {} : { status }),
		...(retryAfterMs === undefined ? {} : { retryAfterMs }),
	};
	if (circuit) {
		Object.defineProperty(failure, 'circuit', {
			configurable: false,
			enumerable: false,
			value: circuit,
			writable: false,
		});
	}
	return {
		ok: false,
		failure,
	};
}

function domainHtmlFailureFromError(error: DomainHtmlFetchError): DomainHtmlFetchFailure {
	const failure: DomainHtmlFetchFailure = {
		kind: error.kind,
		reason: error.reason,
		...(error.status === undefined ? {} : { status: error.status }),
		...(error.retryAfterMs === undefined ? {} : { retryAfterMs: error.retryAfterMs }),
	};
	if (error.circuit) {
		Object.defineProperty(failure, 'circuit', {
			configurable: false,
			enumerable: false,
			value: error.circuit,
			writable: false,
		});
	}
	return failure;
}

function normalizeHostname(hostname: string): string {
	return hostname
		.toLowerCase()
		.replace(/^\[|\]$/g, '')
		.replace(/\.+$/, '');
}

function retainPublicRedirectHeaders(headers: Record<string, string>): Record<string, string> {
	return Object.fromEntries(
		Object.entries(headers).filter(([name]) => PUBLIC_REDIRECT_HEADER_NAMES.has(name.toLowerCase()))
	);
}

function isInternalHostname(hostname: string): boolean {
	if (!hostname.includes('.')) {
		return true;
	}

	return INTERNAL_HOSTNAME_SUFFIXES.some(
		(suffix) => hostname === suffix || hostname.endsWith(`.${suffix}`)
	);
}

function isIPv4Address(hostname: string): boolean {
	const segments = hostname.split('.');
	return (
		segments.length === 4 &&
		segments.every((segment) => /^\d{1,3}$/.test(segment) && Number(segment) <= 255)
	);
}

function getIpAddressFamily(address: string): 4 | 6 | undefined {
	if (isIPv4Address(address)) {
		return 4;
	}
	return expandIPv6Address(address) ? 6 : undefined;
}

function isBlockedIPv4Address(hostname: string): boolean {
	const [first = 0, second = 0, third = 0] = hostname.split('.').map(Number);
	return (
		first === 0 ||
		first === 10 ||
		first === 127 ||
		(first === 100 && second >= 64 && second <= 127) ||
		(first === 169 && second === 254) ||
		(first === 172 && second >= 16 && second <= 31) ||
		(first === 192 && second === 0 && third === 0) ||
		(first === 192 && second === 0 && third === 2) ||
		(first === 192 && second === 88 && third === 99) ||
		(first === 192 && second === 168) ||
		(first === 198 && (second === 18 || second === 19)) ||
		(first === 198 && second === 51 && third === 100) ||
		(first === 203 && second === 0 && third === 113) ||
		first >= 224
	);
}

function isBlockedIPv6Address(hostname: string): boolean {
	const segments = expandIPv6Address(hostname);
	if (!segments) {
		return true;
	}

	const [first = 0, second = 0] = segments;
	// Accept only globally routed unicast space, then remove the special-purpose
	// ranges that sit inside 2000::/3. This rejects local-use translation,
	// mapped, loopback, ULA, link/site-local, multicast, and future reserved
	// space by default instead of relying on a denylist.
	if (first < 0x2000 || first > 0x3fff) {
		return true;
	}
	if (
		(first === 0x2001 && second <= 0x01ff) ||
		(first === 0x2001 && second === 0x0db8) ||
		first === 0x2002 ||
		(first === 0x3fff && (second & 0xf000) === 0)
	) {
		return true;
	}

	return false;
}

function expandIPv6Address(hostname: string): number[] | undefined {
	const compressionIndex = hostname.indexOf('::');
	if (compressionIndex !== -1 && compressionIndex !== hostname.lastIndexOf('::')) {
		return undefined;
	}

	const [left = '', right = ''] = hostname.split('::');
	const leftSegments = left ? left.split(':') : [];
	const rightSegments = right ? right.split(':') : [];
	const missingSegmentCount = 8 - leftSegments.length - rightSegments.length;
	if ((compressionIndex === -1 && missingSegmentCount !== 0) || missingSegmentCount < 0) {
		return undefined;
	}

	const rawSegments = [
		...leftSegments,
		...Array.from({ length: missingSegmentCount }, () => '0'),
		...rightSegments,
	];
	if (rawSegments.length !== 8 || rawSegments.some((segment) => !/^[\da-f]{1,4}$/i.test(segment))) {
		return undefined;
	}

	return rawSegments.map((segment) => Number.parseInt(segment, 16));
}

const INTERNAL_HOSTNAME_SUFFIXES = [
	'home.arpa',
	'internal',
	'intranet',
	'lan',
	'local',
	'localdomain',
	'localhost',
] as const;

async function waitForOperation<TValue>(
	operation: Promise<TValue>,
	signal: AbortSignal
): Promise<TValue> {
	throwIfAborted(signal);

	return await new Promise<TValue>((resolve, reject) => {
		const abort = () => reject(signal.reason ?? new Error('Domain fetch aborted'));
		signal.addEventListener('abort', abort, { once: true });
		operation.then(
			(value) => {
				signal.removeEventListener('abort', abort);
				resolve(value);
			},
			(error: unknown) => {
				signal.removeEventListener('abort', abort);
				reject(error);
			}
		);
	});
}

function throwIfAborted(signal: AbortSignal): void {
	if (signal.aborted) {
		throw signal.reason ?? new Error('Domain fetch aborted');
	}
}

async function fetchWithPinnedNodeTransport(
	input: string,
	init?: Parameters<DomainHtmlFetchLike>[1]
): Promise<Awaited<ReturnType<DomainHtmlFetchLike>>> {
	const { fetchWithPinnedNodeTransport: transport } = await import('@0xintuition/atom-parser/ssrf');
	return transport(input, init);
}
