import {
	type ProviderErrorReason,
	providerErrorReason,
} from '@0xintuition/pipeline-runtime/provider-observer';
import type { RequestOutcome } from '@0xintuition/pipeline-runtime/provider-request-observation';
import { z } from 'zod/v4';
import { ProviderHttpError } from './http';

/**
 * `ProviderHttpError`-aware classification of failed provider requests (ENG-16466,
 * ENG-16976). The abort, deadline and recording rules (`beginObservedRequest`,
 * `observeProviderRequest`, `observeSlottedProviderRequest`, `isEngineDeadline`) are
 * pure and live in `@0xintuition/pipeline-runtime/provider-request-observation`, so
 * classification and trpc share them; only what needs `http.ts` stays here.
 */

// Node/undici codes, and the ones Bun's fetch reports on a plain Error (ConnectionRefused,
// ConnectionClosed, FailedToOpenSocket); same set the tRPC client treats as transient.
const NETWORK_CODES = new Set([
	'ENOTFOUND',
	'EAI_AGAIN',
	'ECONNREFUSED',
	'ECONNRESET',
	'EPIPE',
	'UND_ERR_SOCKET',
	'ConnectionRefused',
	'ConnectionClosed',
	'FailedToOpenSocket',
]);

/** The `code` of an error or of the nearest cause that has one. */
export function providerErrorCode(error: unknown): string | undefined {
	if (!error || typeof error !== 'object') return undefined;
	const { code, cause } = error as { code?: unknown; cause?: unknown };
	if (typeof code === 'string') return code;
	return cause && cause !== error ? providerErrorCode(cause) : undefined;
}

/**
 * A failed `fetch` throws a `TypeError` ("fetch failed" in undici and Bun, "Failed to fetch" /
 * "Load failed" / "NetworkError" in browsers), usually with the system error as `cause`. Any other
 * `TypeError` ("Cannot read properties of undefined") is a programming bug, not a network fault.
 */
const FETCH_FAILURE_MESSAGE =
	/fetch failed|failed to fetch|load failed|networkerror|terminated|socket|connect|econn|enotfound|eai_again/i;

function isFetchFailure(error: unknown): boolean {
	if (!(error instanceof TypeError)) return false;
	return FETCH_FAILURE_MESSAGE.test(error.message) || providerErrorCode(error.cause) !== undefined;
}

/**
 * Timeouts and transport faults, which look the same for every provider.
 * `undefined` when the error is neither. The engine deadline is judged
 * separately (see `beginObservedRequest`); a timer or `AbortSignal.timeout` firing inside the
 * request is a provider timeout.
 */
export function classifyTransportError(error: unknown): RequestOutcome | undefined {
	const name = error instanceof Error ? error.name : '';
	const code = providerErrorCode(error);
	// Opengraph reports its own timer and transport faults by code.
	if (name === 'AbortError' || name === 'TimeoutError' || code === 'timeout') {
		return { outcome: 'error', reason: 'timeout' };
	}
	if (
		isFetchFailure(error) ||
		code === 'network' ||
		code === 'dns_not_found' ||
		(code !== undefined && NETWORK_CODES.has(code))
	) {
		return { outcome: 'error', reason: 'network' };
	}
	return undefined;
}

export type ProviderStatusOutcome = 'miss' | ProviderErrorReason;

/** A status's meaning, or its meaning by the response's error code. */
export type ProviderStatusRule =
	| ProviderStatusOutcome
	| {
			byErrorCode: Readonly<Record<string, ProviderStatusOutcome>>;
			default?: ProviderStatusOutcome;
	  };

function resolveStatusRule(
	rule: ProviderStatusRule | undefined,
	errorCode: string | undefined
): ProviderStatusOutcome | undefined {
	if (rule === undefined || typeof rule === 'string') return rule;
	if (errorCode !== undefined && Object.hasOwn(rule.byErrorCode, errorCode)) {
		return rule.byErrorCode[errorCode];
	}
	return rule.default;
}

export type ClassifyProviderRequestOptions = {
	/**
	 * What a provider-reported HTTP status means for this provider, overriding the generic
	 * range mapping: `'miss'` ("the provider has nothing for this id"), or a reason such as
	 * `rate_limited` or `auth_failed` (token or user agent refused). A status the body's error
	 * code can disambiguate (an OAuth token endpoint answers 400 for both `invalid_client` and
	 * `unsupported_grant_type`) takes `{ byErrorCode, default }`, keyed on the sanitised
	 * `ProviderHttpError.errorCode` (captured only when the request opts in); with no match and
	 * no `default` the generic mapping applies. Only statuses of a plain `provider_http_error`
	 * are looked up; the fixed statuses of guard errors never are.
	 */
	statusOutcomes: Partial<Record<number, ProviderStatusRule>>;
};

/**
 * Outcome of a failed provider request, shared by every enrichment provider.
 * For a `ProviderHttpError`: the error class is checked FIRST, because guard
 * errors carry fixed statuses (`target_rejected` 400, `response_too_large` 413,
 * `embargoed_host` 451, `invalid_json` 502, redirect classes 3xx) that a
 * provider's `statusOutcomes` must never reinterpret; then `statusOutcomes`;
 * then the generic status range. Schema and JSON failures, and a runtime's own refused
 * redirect (`UnexpectedRedirect`), are `invalid_response`;
 * timeouts and transport faults follow `classifyTransportError`; anything else
 * is `other`.
 */
export function classifyProviderRequestError(
	error: unknown,
	options: ClassifyProviderRequestOptions
): RequestOutcome {
	if (error instanceof ProviderHttpError) {
		if (error.errorClass !== 'provider_http_error') {
			return { outcome: 'error', reason: providerErrorReason({ kind: error.errorClass }) };
		}
		const mapped = resolveStatusRule(
			Object.hasOwn(options.statusOutcomes, error.status)
				? options.statusOutcomes[error.status]
				: undefined,
			error.errorCode
		);
		if (mapped === 'miss') return { outcome: 'miss', reason: 'none' };
		if (mapped) return { outcome: 'error', reason: mapped };
		return { outcome: 'error', reason: providerErrorReason({ status: error.status }) };
	}
	if (error instanceof z.ZodError || error instanceof SyntaxError) {
		return { outcome: 'error', reason: 'invalid_response' };
	}
	// A runtime refusing a redirect (`redirect: 'error'`) is the same answer as the pinned hop's
	// `redirect_rejected`. Bun throws a plain Error with this code, not a TypeError.
	if (providerErrorCode(error) === 'UnexpectedRedirect') {
		return { outcome: 'error', reason: 'invalid_response' };
	}
	return classifyTransportError(error) ?? { outcome: 'error', reason: 'other' };
}
