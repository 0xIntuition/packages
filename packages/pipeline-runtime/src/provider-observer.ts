/**
 * Provider observability seam (ENG-16466, contract="1").
 *
 * Domain packages emit typed events here; the api and workers register an
 * observer that turns them into metrics. This module must stay free of any
 * metrics library and any I/O. Emission is fire-and-forget: an observer can
 * never throw into, delay, or change the result of the code that emitted.
 *
 * Every field of an event is a member of a closed allowlist, so no URL, id,
 * title or error text can reach a label value.
 */

import type { ProviderOperationRef } from './provider-registry';

export const PROVIDER_OUTCOMES = ['hit', 'miss', 'ambiguous', 'budget_exhausted', 'error'] as const;
export const PROVIDER_ERROR_REASONS = [
	'timeout',
	'rate_limited',
	'upstream_5xx',
	'http_4xx',
	'network',
	'circuit_open',
	'invalid_response',
	'blocked',
	// The provider refused our credentials or identity (token rejected, forbidden user agent).
	'auth_failed',
	'other',
] as const;
/**
 * Reasons a live `hit` or `miss` can carry, for the operations whose registry entry declares them
 * (`ProviderOperationSpec.liveOutcomeReasons`). A fixed vocabulary, never a free-form value.
 * - `no_metadata`: the page was fetched but the plugin read no metadata from it (a `hit`).
 * - `dead_url`: the page is gone or its host does not exist (a `miss`).
 */
export const PROVIDER_SUCCESS_REASONS = ['no_metadata', 'dead_url'] as const;
export const PROVIDER_REASONS = [
	'none',
	...PROVIDER_ERROR_REASONS,
	...PROVIDER_SUCCESS_REASONS,
] as const;
export const PROVIDER_SOURCES = ['live', 'cache'] as const;

export const PROVIDER_RESOLUTION_INPUTS = ['goodreads'] as const;
export const PROVIDER_RESOLUTIONS = ['resolved', 'ambiguous', 'unresolved'] as const;
export const PROVIDER_RESOLUTION_ROUTES = ['goodreads_id', 'title', 'none'] as const;
export const PROVIDER_RESOLUTION_QUALITIES = [
	'title_and_cover',
	'title_only',
	'placeholder',
	'unknown',
] as const;
export const PROVIDER_RESOLUTION_CALLERS = ['preview', 'attach_verify'] as const;

export type {
	ProviderName,
	ProviderOperation,
	ProviderOperationOf,
	ProviderOperationRef,
} from './provider-registry';
export type ProviderOutcome = (typeof PROVIDER_OUTCOMES)[number];
export type ProviderErrorReason = (typeof PROVIDER_ERROR_REASONS)[number];
export type ProviderSuccessReason = (typeof PROVIDER_SUCCESS_REASONS)[number];
export type ProviderReason = (typeof PROVIDER_REASONS)[number];
export type ProviderSource = (typeof PROVIDER_SOURCES)[number];

/** The `(provider, operation)` pair is correlated: see {@link ProviderOperationRef}. */
export type ProviderRequestEvent = ProviderOperationRef & {
	type: 'provider_request';
	outcome: ProviderOutcome;
	/** `none` unless `outcome` is `error`, or a live hit/miss whose operation declares a success reason. */
	reason: ProviderReason;
	source: ProviderSource;
	/** Wall time of the live request; absent for cache hits. */
	durationMs?: number;
};

export type ProviderResolutionEvent = {
	type: 'provider_resolution';
	input: (typeof PROVIDER_RESOLUTION_INPUTS)[number];
	resolution: (typeof PROVIDER_RESOLUTIONS)[number];
	route: (typeof PROVIDER_RESOLUTION_ROUTES)[number];
	quality: (typeof PROVIDER_RESOLUTION_QUALITIES)[number];
	caller: (typeof PROVIDER_RESOLUTION_CALLERS)[number];
	goodreadsBookId?: string;
	openLibraryWorkKey?: string;
	candidateCount: number;
	durationMs: number;
	lookups: readonly ProviderRequestEvent[];
};

export type ProviderEvent = ProviderRequestEvent | ProviderResolutionEvent;
export type ProviderObserver = (event: ProviderEvent) => void;

const observers = new Set<ProviderObserver>();

/** Registers an observer; the returned function removes it. */
export function addProviderObserver(observer: ProviderObserver): () => void {
	observers.add(observer);
	return () => {
		observers.delete(observer);
	};
}

export function resetProviderObserversForTests(): void {
	observers.clear();
}

/** Delivers the event to every observer. Never throws and never returns a value. */
export function emitProviderEvent(event: ProviderEvent): void {
	for (const observer of [...observers]) {
		try {
			observer(event);
		} catch {
			// Observability must never alter the observed path.
		}
	}
}

/**
 * The error class / engine error code of a provider throttle response. One constant so the HTTP
 * layer, the engine and the metric reason cannot drift apart on a typo.
 */
export const RATE_LIMITED_KIND = 'rate_limited';

/**
 * Reason for a failed request from an HTTP status and/or a pipeline error
 * kind. Both inputs are inspected only against fixed values.
 */
export function providerErrorReason(input: {
	kind?: string;
	reason?: string;
	status?: number;
}): ProviderErrorReason {
	const { kind, reason, status } = input;
	if (kind === 'circuit_open' || reason === 'circuit_open') return 'circuit_open';
	if (kind === 'auth_failed' || reason === 'auth_failed') return 'auth_failed';
	if (kind === 'timeout' || reason === 'timeout') return 'timeout';
	// A redirect away from the provider (or too many of them) is an unusable response.
	if (
		kind === 'redirect_exhausted' ||
		kind === 'redirect_rejected' ||
		reason === 'redirect_exhausted' ||
		reason === 'redirect_rejected'
	) {
		return 'invalid_response';
	}
	if (
		kind === 'waf_challenge' ||
		reason === 'waf_challenge' ||
		kind === 'ssrf_rejected' ||
		kind === 'target_rejected' ||
		kind === 'embargoed_host'
	) {
		return 'blocked';
	}
	// A provider-specific throttle response (MusicBrainz answers its per-IP limit with 503): the HTTP
	// layer gives the error this class (`ProviderHttpOptions.statusClasses`), so it arrives as `kind`.
	if (kind === RATE_LIMITED_KIND) return 'rate_limited';
	if (status === 429) return 'rate_limited';
	if (status !== undefined && status >= 500 && status < 600) return 'upstream_5xx';
	if (status !== undefined && status >= 400 && status < 500) return 'http_4xx';
	if (kind === 'dns_failure' || kind === 'body_read_failure' || kind === 'adapter_error') {
		return 'network';
	}
	// The shared provider HTTP helper's classes for the same failures (ENG-16632); `api_error` is a
	// MediaWiki action API error answered as HTTP 200 (valid JSON, unusable response).
	if (
		kind === 'parse_failure' ||
		kind === 'body_limit' ||
		kind === 'invalid_json' ||
		kind === 'api_error' ||
		kind === 'response_too_large'
	)
		return 'invalid_response';
	// Pinned: these carry no provider-side signal, so they are `other` on purpose.
	if (kind === 'adapter_null' || kind === 'identity_conflict') return 'other';
	return 'other';
}
