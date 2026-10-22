import {
	PROVIDER_ENRICHMENT_OPERATIONS,
	PROVIDER_ERROR_REASONS,
	PROVIDER_NAMES,
	PROVIDER_OUTCOMES,
	PROVIDER_PAGE_OPERATIONS,
	PROVIDER_RESOLUTION_CALLERS,
	PROVIDER_RESOLUTION_INPUTS,
	PROVIDER_RESOLUTION_QUALITIES,
	PROVIDER_RESOLUTION_ROUTES,
	PROVIDER_RESOLUTIONS,
	PROVIDER_SEARCH_OPERATIONS,
	PROVIDER_SOURCES,
	type ProviderErrorReason,
	type ProviderName,
	type ProviderOperation,
	type ProviderOutcome,
	type ProviderReason,
	type ProviderRequestEvent,
	type ProviderResolutionEvent,
	type ProviderSource,
} from './provider-observer';

/**
 * The single source of truth for provider metrics contract "1"
 * (gcp-deployment#438 plus the PR #2264 amendments). Every exporter (api,
 * workers) builds its families, pre-registered series and event handling from
 * this module, so a rename or a new label value is made once. Exporters
 * pre-register exactly the tuples enumerated here at 0 and route every event
 * through the normalizers, so an event can never mint a label value outside
 * the allowlists.
 */
export const PROVIDER_METRICS_CONTRACT = '1';
export const PROVIDER_DURATION_BUCKETS_SECONDS = [0.05, 0.1, 0.25, 0.5, 1, 2, 3, 5, 10] as const;
export const PROVIDER_CIRCUIT_HOSTS = ['openlibrary.org'] as const;
/** Families an event can be dropped from. */
export const PROVIDER_DROPPED_FAMILIES = ['requests', 'resolutions'] as const;

export type ProviderCircuitHost = (typeof PROVIDER_CIRCUIT_HOSTS)[number];
export type ProviderDroppedFamily = (typeof PROVIDER_DROPPED_FAMILIES)[number];

/**
 * Which producer exports what.
 * - `api`: every operation (including the goodreads `page` fetch), the resolutions, the circuit gauge.
 * - `classification` (kg-classification-worker): the search operations and the circuit gauge.
 * - `enrichment` (kg-enrichment-worker): the enrichment operations and the goodreads `page` fetch.
 */
export type ProviderMetricsScope = 'api' | 'classification' | 'enrichment';
export const PROVIDER_METRICS_SCOPES = ['api', 'classification', 'enrichment'] as const;

export const PROVIDER_METRIC_FAMILIES = {
	requests: {
		name: 'intuition_provider_requests_total',
		type: 'counter',
		help: 'External provider lookups, one per logical lookup after cache resolution.',
		labelNames: ['provider', 'operation', 'outcome', 'reason', 'source'],
	},
	duration: {
		name: 'intuition_provider_request_duration_seconds',
		type: 'histogram',
		help: 'Duration of live external provider requests, in seconds.',
		labelNames: ['provider', 'operation'],
		buckets: PROVIDER_DURATION_BUCKETS_SECONDS,
	},
	resolutions: {
		name: 'intuition_provider_resolutions_total',
		type: 'counter',
		help: 'Provider-backed input resolutions that reached a result.',
		labelNames: ['input', 'resolution', 'route', 'quality', 'caller'],
	},
	circuitOpen: {
		name: 'intuition_provider_circuit_open',
		type: 'gauge',
		help: 'Whether the per-host provider circuit breaker is refusing requests (1) or not (0).',
		labelNames: ['host'],
	},
	info: {
		name: 'intuition_provider_instrumentation_info',
		type: 'gauge',
		help: 'Always 1 while provider instrumentation of this contract version is exported.',
		labelNames: ['contract'],
	},
	dropped: {
		name: 'intuition_provider_events_dropped_total',
		type: 'counter',
		help: 'Provider events discarded because they failed contract normalization.',
		labelNames: ['family'],
	},
} as const;

export type ProviderRequestLabels = {
	provider: ProviderName;
	operation: ProviderOperation;
	outcome: ProviderOutcome;
	reason: ProviderReason;
	source: ProviderSource;
};

export type ProviderResolutionLabels = Pick<
	ProviderResolutionEvent,
	'input' | 'resolution' | 'route' | 'quality' | 'caller'
>;

export type ProviderDurationLabels = Pick<ProviderRequestLabels, 'provider' | 'operation'>;

export const PROVIDER_RESOLUTION_VALUES = {
	input: PROVIDER_RESOLUTION_INPUTS,
	resolution: PROVIDER_RESOLUTIONS,
	route: PROVIDER_RESOLUTION_ROUTES,
	quality: PROVIDER_RESOLUTION_QUALITIES,
	caller: PROVIDER_RESOLUTION_CALLERS,
} as const satisfies Record<keyof ProviderResolutionLabels, readonly string[]>;

const SCOPE_OPERATIONS = {
	api: [
		...PROVIDER_SEARCH_OPERATIONS,
		...PROVIDER_ENRICHMENT_OPERATIONS,
		...PROVIDER_PAGE_OPERATIONS,
	],
	classification: [...PROVIDER_SEARCH_OPERATIONS],
	// Classification never fetches the goodreads.com page; enrichment does, about twice per uncached
	// paste (opengraph and microdata each fetch it), so one paste yields about two `page` events.
	enrichment: [...PROVIDER_ENRICHMENT_OPERATIONS, ...PROVIDER_PAGE_OPERATIONS],
} as const satisfies Record<ProviderMetricsScope, readonly ProviderOperation[]>;

const SCOPE_EXPORTS_CIRCUIT: Record<ProviderMetricsScope, boolean> = {
	api: true,
	classification: true,
	enrichment: false,
};
const SCOPE_EXPORTS_RESOLUTIONS: Record<ProviderMetricsScope, boolean> = {
	api: true,
	classification: false,
	enrichment: false,
};

/** Operations a scope exports. */
export function providerOperationsForScope(scope: ProviderMetricsScope): ProviderOperation[] {
	return [...SCOPE_OPERATIONS[scope]];
}

export function providerScopeExportsCircuit(scope: ProviderMetricsScope): boolean {
	return SCOPE_EXPORTS_CIRCUIT[scope];
}

export function providerScopeExportsResolutions(scope: ProviderMetricsScope): boolean {
	return SCOPE_EXPORTS_RESOLUTIONS[scope];
}

const PAGE_OPERATION_SET: ReadonlySet<string> = new Set(PROVIDER_PAGE_OPERATIONS);
const SEARCH_OPERATION_SET: ReadonlySet<string> = new Set(PROVIDER_SEARCH_OPERATIONS);
const OUTCOME_SET: ReadonlySet<string> = new Set(PROVIDER_OUTCOMES);
const SOURCE_SET: ReadonlySet<string> = new Set(PROVIDER_SOURCES);
const PROVIDER_NAME_SET: ReadonlySet<string> = new Set(PROVIDER_NAMES);
const ERROR_REASON_SET: ReadonlySet<string> = new Set(PROVIDER_ERROR_REASONS);
const CIRCUIT_HOST_SET: ReadonlySet<string> = new Set(PROVIDER_CIRCUIT_HOSTS);
const SCOPE_OPERATION_SETS: Record<ProviderMetricsScope, ReadonlySet<string>> = {
	api: new Set(SCOPE_OPERATIONS.api),
	classification: new Set(SCOPE_OPERATIONS.classification),
	enrichment: new Set(SCOPE_OPERATIONS.enrichment),
};

/** The provider an operation belongs to: the page fetch is goodreads.com, everything else OpenLibrary. */
export function providerForOperation(operation: ProviderOperation): ProviderName {
	return PAGE_OPERATION_SET.has(operation) ? 'goodreads' : 'openlibrary';
}

function isSearchOperation(operation: ProviderOperation): boolean {
	return SEARCH_OPERATION_SET.has(operation);
}

/**
 * An enrichment fetch is a single request: it never passes the shared host
 * breaker, so `circuit_open` cannot occur for it.
 */
function errorReasonsFor(operation: ProviderOperation): readonly ProviderErrorReason[] {
	return isSearchOperation(operation)
		? PROVIDER_ERROR_REASONS
		: PROVIDER_ERROR_REASONS.filter((reason) => reason !== 'circuit_open');
}

function liveOutcomesFor(operation: ProviderOperation): readonly ProviderOutcome[] {
	if (!isSearchOperation(operation)) return ['hit', 'miss'];
	return operation === 'search_title'
		? ['hit', 'miss', 'budget_exhausted', 'ambiguous']
		: ['hit', 'miss', 'budget_exhausted'];
}

function cacheOutcomesFor(operation: ProviderOperation): readonly ProviderOutcome[] {
	if (!isSearchOperation(operation)) return [];
	return operation === 'search_title' ? ['hit', 'miss', 'ambiguous'] : ['hit', 'miss'];
}

/** Explicit series keys; they never depend on property insertion order. */
export function providerRequestLabelsKey(labels: ProviderRequestLabels): string {
	return [labels.provider, labels.operation, labels.outcome, labels.reason, labels.source].join(
		'|'
	);
}

export function providerResolutionLabelsKey(labels: ProviderResolutionLabels): string {
	return [labels.input, labels.resolution, labels.route, labels.quality, labels.caller].join('|');
}

/** Every valid `intuition_provider_requests_total` tuple for the scope. */
export function enumerateProviderRequestSeries(
	scope: ProviderMetricsScope
): ProviderRequestLabels[] {
	const series: ProviderRequestLabels[] = [];
	for (const operation of SCOPE_OPERATIONS[scope]) {
		const provider = providerForOperation(operation);
		for (const outcome of liveOutcomesFor(operation)) {
			series.push({ provider, operation, outcome, reason: 'none', source: 'live' });
		}
		for (const reason of errorReasonsFor(operation)) {
			series.push({ provider, operation, outcome: 'error', reason, source: 'live' });
		}
		for (const outcome of cacheOutcomesFor(operation)) {
			series.push({ provider, operation, outcome, reason: 'none', source: 'cache' });
		}
	}
	return series;
}

function routesFor(resolution: ProviderResolutionLabels['resolution']) {
	// Only a resolved work was reached by a route; `none` there means the
	// lookups that found it were not observed (resolver cache, proxied classify).
	return resolution === 'resolved' ? PROVIDER_RESOLUTION_ROUTES : (['none'] as const);
}

function qualitiesFor(caller: ProviderResolutionLabels['caller']) {
	// attach_verify never runs enrichment, so no quality can be determined.
	return caller === 'attach_verify' ? (['unknown'] as const) : PROVIDER_RESOLUTION_QUALITIES;
}

/** Every valid `intuition_provider_resolutions_total` tuple. */
export function enumerateProviderResolutionSeries(): ProviderResolutionLabels[] {
	const series: ProviderResolutionLabels[] = [];
	for (const input of PROVIDER_RESOLUTION_INPUTS) {
		for (const resolution of PROVIDER_RESOLUTIONS) {
			for (const route of routesFor(resolution)) {
				for (const caller of PROVIDER_RESOLUTION_CALLERS) {
					for (const quality of qualitiesFor(caller)) {
						series.push({ input, resolution, route, quality, caller });
					}
				}
			}
		}
	}
	return series;
}

const VALID_REQUEST_KEYS: Record<ProviderMetricsScope, ReadonlySet<string>> = {
	api: new Set(enumerateProviderRequestSeries('api').map(providerRequestLabelsKey)),
	classification: new Set(
		enumerateProviderRequestSeries('classification').map(providerRequestLabelsKey)
	),
	enrichment: new Set(enumerateProviderRequestSeries('enrichment').map(providerRequestLabelsKey)),
};
const VALID_RESOLUTION_KEYS: ReadonlySet<string> = new Set(
	enumerateProviderResolutionSeries().map(providerResolutionLabelsKey)
);

/**
 * Maps an arbitrary event onto a valid tuple of the scope, or `undefined` when
 * no valid tuple exists (unknown provider/operation/outcome/source, or a
 * combination the contract does not enumerate). An unknown or inapplicable
 * error reason becomes `other`. Nothing from the event except membership in
 * the allowlists is ever returned.
 */
export function normalizeProviderRequestEvent(
	scope: ProviderMetricsScope,
	event: unknown
): ProviderRequestLabels | undefined {
	if (typeof event !== 'object' || event === null) return undefined;
	const raw = event as Partial<Record<keyof ProviderRequestEvent, unknown>>;
	if (typeof raw.provider !== 'string' || !PROVIDER_NAME_SET.has(raw.provider)) return undefined;
	if (typeof raw.operation !== 'string' || !SCOPE_OPERATION_SETS[scope].has(raw.operation)) {
		return undefined;
	}
	if (typeof raw.outcome !== 'string' || !OUTCOME_SET.has(raw.outcome)) return undefined;
	if (typeof raw.source !== 'string' || !SOURCE_SET.has(raw.source)) return undefined;
	const operation = raw.operation as ProviderOperation;
	const outcome = raw.outcome as ProviderOutcome;
	let reason: ProviderReason = 'none';
	if (outcome === 'error') {
		reason =
			typeof raw.reason === 'string' &&
			ERROR_REASON_SET.has(raw.reason) &&
			errorReasonsFor(operation).includes(raw.reason as ProviderErrorReason)
				? (raw.reason as ProviderErrorReason)
				: 'other';
	}
	const labels: ProviderRequestLabels = {
		provider: raw.provider as ProviderName,
		operation,
		outcome,
		reason,
		source: raw.source as ProviderSource,
	};
	return VALID_REQUEST_KEYS[scope].has(providerRequestLabelsKey(labels)) ? labels : undefined;
}

function pickMember<T extends string>(values: readonly T[], candidate: unknown): T | undefined {
	return values.find((value) => value === candidate);
}

export function normalizeProviderResolutionEvent(
	event: unknown
): ProviderResolutionLabels | undefined {
	if (typeof event !== 'object' || event === null) return undefined;
	const raw = event as Record<string, unknown>;
	const input = pickMember(PROVIDER_RESOLUTION_INPUTS, raw.input);
	const resolution = pickMember(PROVIDER_RESOLUTIONS, raw.resolution);
	const route = pickMember(PROVIDER_RESOLUTION_ROUTES, raw.route);
	const quality = pickMember(PROVIDER_RESOLUTION_QUALITIES, raw.quality);
	const caller = pickMember(PROVIDER_RESOLUTION_CALLERS, raw.caller);
	if (!input || !resolution || !route || !quality || !caller) return undefined;
	const labels: ProviderResolutionLabels = { input, resolution, route, quality, caller };
	return VALID_RESOLUTION_KEYS.has(providerResolutionLabelsKey(labels)) ? labels : undefined;
}

/** Allowlisted host for the circuit gauge; anything else is not exported. */
export function normalizeProviderCircuitHost(host: unknown): ProviderCircuitHost | undefined {
	return typeof host === 'string' && CIRCUIT_HOST_SET.has(host)
		? (host as ProviderCircuitHost)
		: undefined;
}

/**
 * Seconds for a live request duration, or `undefined` when the event carries no
 * finite duration. Exporters skip the histogram observation on `undefined`, so
 * a NaN can never reach a sum.
 */
export function providerDurationSeconds(event: { durationMs?: unknown }): number | undefined {
	const { durationMs } = event;
	return typeof durationMs === 'number' && Number.isFinite(durationMs)
		? Math.max(0, durationMs) / 1000
		: undefined;
}

export type ProviderValidTuple =
	| { family: 'requests'; labels: ProviderRequestLabels }
	| { family: 'duration'; labels: ProviderDurationLabels }
	| { family: 'resolutions'; labels: ProviderResolutionLabels }
	| { family: 'circuitOpen'; labels: { host: ProviderCircuitHost } }
	| { family: 'info'; labels: { contract: typeof PROVIDER_METRICS_CONTRACT } }
	| { family: 'dropped'; labels: { family: ProviderDroppedFamily } };

/**
 * Visits every valid label tuple of every family the scope exports, in family
 * order. Exporters pre-register series by iterating this, so the zero-series
 * are defined here once and not per exporter.
 */
export function forEachValidTuple(
	scope: ProviderMetricsScope,
	visit: (tuple: ProviderValidTuple) => void
): void {
	for (const labels of enumerateProviderRequestSeries(scope)) {
		visit({ family: 'requests', labels });
	}
	for (const operation of SCOPE_OPERATIONS[scope]) {
		visit({
			family: 'duration',
			labels: { provider: providerForOperation(operation), operation },
		});
	}
	if (SCOPE_EXPORTS_RESOLUTIONS[scope]) {
		for (const labels of enumerateProviderResolutionSeries()) {
			visit({ family: 'resolutions', labels });
		}
	}
	if (SCOPE_EXPORTS_CIRCUIT[scope]) {
		for (const host of PROVIDER_CIRCUIT_HOSTS) {
			visit({ family: 'circuitOpen', labels: { host } });
		}
	}
	visit({ family: 'info', labels: { contract: PROVIDER_METRICS_CONTRACT } });
	for (const family of PROVIDER_DROPPED_FAMILIES) {
		visit({ family: 'dropped', labels: { family } });
	}
}
