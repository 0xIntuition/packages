import {
	PROVIDER_ERROR_REASONS,
	PROVIDER_OUTCOMES,
	PROVIDER_RESOLUTION_CALLERS,
	PROVIDER_RESOLUTION_INPUTS,
	PROVIDER_RESOLUTION_QUALITIES,
	PROVIDER_RESOLUTION_ROUTES,
	PROVIDER_RESOLUTIONS,
	PROVIDER_SOURCES,
	type ProviderErrorReason,
	type ProviderOutcome,
	type ProviderReason,
	type ProviderRequestEvent,
	type ProviderResolutionEvent,
	type ProviderSource,
} from './provider-observer';
import {
	buildProviderRegistry,
	PROVIDER_CIRCUIT_HOSTS,
	PROVIDER_METRICS_SCOPES,
	PROVIDER_REGISTRY,
	type ProviderCircuitHost,
	type ProviderMetricsScope,
	type ProviderName,
	type ProviderOperation,
	type ProviderRegistry,
} from './provider-registry';

export { PROVIDER_CIRCUIT_HOSTS, PROVIDER_METRICS_SCOPES };
export type { ProviderCircuitHost, ProviderMetricsScope };

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
/** Families an event can be dropped from. */
export const PROVIDER_DROPPED_FAMILIES = ['requests', 'resolutions'] as const;

export type ProviderDroppedFamily = (typeof PROVIDER_DROPPED_FAMILIES)[number];

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

const SCOPE_EXPORTS_RESOLUTIONS: Record<ProviderMetricsScope, boolean> = {
	api: true,
	classification: false,
	enrichment: false,
};

export function providerScopeExportsResolutions(scope: ProviderMetricsScope): boolean {
	return SCOPE_EXPORTS_RESOLUTIONS[scope];
}

const OUTCOME_SET: ReadonlySet<string> = new Set(PROVIDER_OUTCOMES);
const SOURCE_SET: ReadonlySet<string> = new Set(PROVIDER_SOURCES);
const ERROR_REASON_SET: ReadonlySet<string> = new Set(PROVIDER_ERROR_REASONS);

/** Explicit series keys; they never depend on property insertion order. */
export function providerRequestLabelsKey(labels: ProviderRequestLabels): string {
	return [labels.provider, labels.operation, labels.outcome, labels.reason, labels.source].join(
		'|'
	);
}

/** Duration histograms are keyed by `provider|operation`; operation names are only unique per provider. */
export function providerDurationLabelsKey(labels: ProviderDurationLabels): string {
	return `${labels.provider}|${labels.operation}`;
}

export function providerResolutionLabelsKey(labels: ProviderResolutionLabels): string {
	return [labels.input, labels.resolution, labels.route, labels.quality, labels.caller].join('|');
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

const VALID_RESOLUTION_KEYS: ReadonlySet<string> = new Set(
	enumerateProviderResolutionSeries().map(providerResolutionLabelsKey)
);

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

/** The registry-dependent half of the contract, built over one registry. */
export type ProviderMetricsContract = {
	/** Operations a scope exports, as `(provider, operation)` pairs in exposition order. */
	providerOperationsForScope(
		scope: ProviderMetricsScope
	): Array<{ provider: ProviderName; operation: ProviderOperation }>;
	providerScopeExportsCircuit(scope: ProviderMetricsScope): boolean;
	/** Every valid `intuition_provider_requests_total` tuple for the scope. */
	enumerateProviderRequestSeries(scope: ProviderMetricsScope): ProviderRequestLabels[];
	/**
	 * Maps an arbitrary event onto a valid tuple of the scope, or `undefined` when
	 * no valid tuple exists (unknown provider/operation/outcome/source, or a
	 * combination the contract does not enumerate). An unknown or inapplicable
	 * error reason becomes `other`. Nothing from the event except membership in
	 * the allowlists is ever returned.
	 */
	normalizeProviderRequestEvent(
		scope: ProviderMetricsScope,
		event: unknown
	): ProviderRequestLabels | undefined;
	/** Allowlisted host for the circuit gauge; anything else is not exported. */
	normalizeProviderCircuitHost(host: unknown): ProviderCircuitHost | undefined;
	/**
	 * Visits every valid label tuple of every family the scope exports, in family
	 * order. Exporters pre-register series by iterating this, so the zero-series
	 * are defined here once and not per exporter.
	 */
	forEachValidTuple(scope: ProviderMetricsScope, visit: (tuple: ProviderValidTuple) => void): void;
};

/**
 * Builds the registry-dependent functions over `registry`. The module-level exports below are
 * this, built over `PROVIDER_REGISTRY`; tests and exporters can pass a registry of their own.
 */
export function createProviderMetricsContract(registry: ProviderRegistry): ProviderMetricsContract {
	const providerNames: ReadonlySet<string> = new Set(registry.providerNames);
	const circuitHosts: ReadonlySet<string> = new Set(registry.circuitHosts);

	function enumerateRequestSeries(scope: ProviderMetricsScope): ProviderRequestLabels[] {
		const series: ProviderRequestLabels[] = [];
		for (const { provider, operation, spec } of registry.operationsForScope(scope)) {
			const base = { provider, operation } as Pick<ProviderRequestLabels, 'provider' | 'operation'>;
			for (const outcome of spec.liveOutcomes) {
				series.push({ ...base, outcome, reason: 'none', source: 'live' });
				for (const reason of spec.liveOutcomeReasons?.[outcome] ?? []) {
					series.push({ ...base, outcome, reason, source: 'live' });
				}
			}
			for (const reason of spec.errorReasons) {
				series.push({ ...base, outcome: 'error', reason, source: 'live' });
			}
			for (const outcome of spec.cacheOutcomes) {
				series.push({ ...base, outcome, reason: 'none', source: 'cache' });
			}
		}
		return series;
	}

	const validRequestKeys = new Map<ProviderMetricsScope, ReadonlySet<string>>(
		PROVIDER_METRICS_SCOPES.map((scope) => [
			scope,
			new Set(enumerateRequestSeries(scope).map(providerRequestLabelsKey)),
		])
	);

	function normalizeRequestEvent(
		scope: ProviderMetricsScope,
		event: unknown
	): ProviderRequestLabels | undefined {
		if (typeof event !== 'object' || event === null) return undefined;
		const raw = event as Partial<Record<keyof ProviderRequestEvent, unknown>>;
		if (typeof raw.provider !== 'string' || !providerNames.has(raw.provider)) return undefined;
		if (typeof raw.operation !== 'string') return undefined;
		// The pairing is the identity: an operation of another provider has no spec here.
		const spec = registry.lookupOperation(raw.provider, raw.operation);
		if (!spec?.scopes.includes(scope)) return undefined;
		if (typeof raw.outcome !== 'string' || !OUTCOME_SET.has(raw.outcome)) return undefined;
		if (typeof raw.source !== 'string' || !SOURCE_SET.has(raw.source)) return undefined;
		const outcome = raw.outcome as ProviderOutcome;
		const source = raw.source as ProviderSource;
		let reason: ProviderReason = 'none';
		if (outcome !== 'error') {
			// Declared, live-only success reasons; anything else is a plain hit/miss.
			const declared = source === 'live' ? spec.liveOutcomeReasons?.[outcome] : undefined;
			reason = declared?.find((candidate) => candidate === raw.reason) ?? 'none';
		} else {
			reason =
				typeof raw.reason === 'string' &&
				ERROR_REASON_SET.has(raw.reason) &&
				spec.errorReasons.includes(raw.reason as ProviderErrorReason)
					? (raw.reason as ProviderErrorReason)
					: 'other';
		}
		const labels = {
			provider: raw.provider,
			operation: raw.operation,
			outcome,
			reason,
			source,
		} as ProviderRequestLabels;
		return validRequestKeys.get(scope)?.has(providerRequestLabelsKey(labels)) ? labels : undefined;
	}

	return {
		providerOperationsForScope: (scope) =>
			registry.operationsForScope(scope).map(({ provider, operation }) => ({
				provider: provider as ProviderName,
				operation: operation as ProviderOperation,
			})),
		providerScopeExportsCircuit: (scope) => registry.circuitHostsForScope(scope).length > 0,
		enumerateProviderRequestSeries: enumerateRequestSeries,
		normalizeProviderRequestEvent: normalizeRequestEvent,
		normalizeProviderCircuitHost: (host) =>
			typeof host === 'string' && circuitHosts.has(host)
				? (host as ProviderCircuitHost)
				: undefined,
		forEachValidTuple(scope, visit) {
			for (const labels of enumerateRequestSeries(scope)) {
				visit({ family: 'requests', labels });
			}
			for (const { provider, operation } of registry.operationsForScope(scope)) {
				visit({
					family: 'duration',
					labels: { provider, operation } as ProviderDurationLabels,
				});
			}
			if (SCOPE_EXPORTS_RESOLUTIONS[scope]) {
				for (const labels of enumerateProviderResolutionSeries()) {
					visit({ family: 'resolutions', labels });
				}
			}
			for (const host of registry.circuitHostsForScope(scope)) {
				visit({ family: 'circuitOpen', labels: { host: host as ProviderCircuitHost } });
			}
			visit({ family: 'info', labels: { contract: PROVIDER_METRICS_CONTRACT } });
			for (const family of PROVIDER_DROPPED_FAMILIES) {
				visit({ family: 'dropped', labels: { family } });
			}
		},
	};
}

const defaultContract = createProviderMetricsContract(buildProviderRegistry(PROVIDER_REGISTRY));

export const {
	providerOperationsForScope,
	providerScopeExportsCircuit,
	enumerateProviderRequestSeries,
	normalizeProviderRequestEvent,
	normalizeProviderCircuitHost,
	forEachValidTuple,
} = defaultContract;
