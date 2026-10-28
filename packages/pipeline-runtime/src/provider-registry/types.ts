import type {
	ProviderErrorReason,
	ProviderOutcome,
	ProviderSuccessReason,
} from '../provider-observer';
import { PROVIDER_ERROR_REASONS } from '../provider-observer';

/**
 * Producers of provider metrics.
 * - `api`: the API process (classification previews and enrichment during create, resolutions, circuit gauge).
 *   An operation that can run in the api process MUST list `api`: the api exporter drops every event
 *   whose operation does not list its scope, so a missing `api` silently loses that traffic.
 * - `classification` (kg-classification-worker): classification lookups and the circuit gauge.
 * - `enrichment` (kg-enrichment-worker): enrichment fetches.
 */
export const PROVIDER_METRICS_SCOPES = ['api', 'classification', 'enrichment'] as const;
export type ProviderMetricsScope = (typeof PROVIDER_METRICS_SCOPES)[number];

export type ProviderLiveOutcome = Exclude<ProviderOutcome, 'error'>;

/** What the contract allows for one `(provider, operation)`. */
export type ProviderOperationSpec = {
	/** Producers that run the operation; each exports its series. */
	scopes: readonly ProviderMetricsScope[];
	/** Outcomes of a live request, in series order. `error` is implied by `errorReasons`. */
	liveOutcomes: readonly ProviderLiveOutcome[];
	/** Reasons an `error` can carry; `other` must be among them (unknown reasons collapse to it). */
	errorReasons: readonly ProviderErrorReason[];
	/** Outcomes served from a cache (`source=cache`). Empty: the operation has no cache source. */
	cacheOutcomes: readonly ProviderLiveOutcome[];
	/**
	 * Extra reasons a LIVE outcome can carry besides `none`, each its own series. Additive and
	 * live-only: a cache event always has reason `none`, and an undeclared reason collapses to `none`.
	 */
	liveOutcomeReasons?: Partial<Record<ProviderLiveOutcome, readonly ProviderSuccessReason[]>>;
};

/** A host whose breaker state a producer exports as `intuition_provider_circuit_open`. */
export type ProviderCircuitHostSpec = {
	host: string;
	scopes: readonly ProviderMetricsScope[];
};

export type ProviderRegistryEntry = {
	provider: string;
	/** Operation names are scoped to the provider: `(provider, operation)` is the identity. */
	operations: Readonly<Record<string, ProviderOperationSpec>>;
	circuitHosts: readonly ProviderCircuitHostSpec[];
};

/** Keeps the literal provider and operation names for the derived types. */
export function defineProvider<const T extends ProviderRegistryEntry>(entry: T): T {
	return entry;
}

/** Every error reason a provider may report (without the ones a provider opts into). */
export const BASE_ERROR_REASONS: readonly ProviderErrorReason[] = PROVIDER_ERROR_REASONS.filter(
	(reason) => reason !== 'auth_failed'
);

/** Reasons for a single request that never passes a shared host breaker. */
export const ERROR_REASONS_WITHOUT_CIRCUIT: readonly ProviderErrorReason[] =
	BASE_ERROR_REASONS.filter((reason) => reason !== 'circuit_open');

/** `ERROR_REASONS_WITHOUT_CIRCUIT` plus `auth_failed`, for a provider that can refuse our credentials or User-Agent. */
export const ERROR_REASONS_WITH_AUTH: readonly ProviderErrorReason[] = [
	...ERROR_REASONS_WITHOUT_CIRCUIT,
	'auth_failed',
];

/**
 * The common operation shape: an `api` + `enrichment` operation with `hit`/`miss` live outcomes,
 * every reason except `circuit_open` (including `auth_failed`) and no cache series. A provider
 * file is then just its table of overrides.
 */
export function defineOperation(
	overrides: Partial<ProviderOperationSpec> = {}
): ProviderOperationSpec {
	return {
		scopes: ['api', 'enrichment'],
		liveOutcomes: ['hit', 'miss'],
		errorReasons: ERROR_REASONS_WITH_AUTH,
		cacheOutcomes: [],
		...overrides,
	};
}

/**
 * The page fetch of the enrichment page plugins (opengraph and microdata): the same spec for
 * `goodreads|page` and `web|page`, so "same as goodreads" is true by construction. A single page
 * fetch never passes the shared host breaker, and a failed fetch is never served from cache.
 */
export const PAGE_OPERATION_SPEC = {
	scopes: ['api', 'enrichment'],
	liveOutcomes: ['hit', 'miss'],
	errorReasons: ERROR_REASONS_WITHOUT_CIRCUIT,
	cacheOutcomes: ['hit', 'miss'],
} as const satisfies ProviderOperationSpec;
