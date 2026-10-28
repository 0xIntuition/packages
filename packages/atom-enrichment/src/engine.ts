import { forEachBounded } from '@0xintuition/pipeline-runtime/concurrency';
import { type Outcome, runWithSignal, withTimeout } from '@0xintuition/pipeline-runtime/outcome';
import { RATE_LIMITED_KIND } from '@0xintuition/pipeline-runtime/provider-observer';
import {
	RequestSlotTimeoutError,
	slotRefusalOf,
	slotRefusalRetryDelayMs,
} from '@0xintuition/pipeline-runtime/request-slot';
import {
	buildCacheKey,
	type CachedEntry,
	isCachedEntryFresh,
	toCancellableCacheAdapter,
} from './cache';
import { observeArtifactCacheHit } from './cache-observation';
import {
	type ClassificationRegistry,
	createDefaultClassificationRegistry,
} from './classifications';
import { redactProviderDiagnostic } from './diagnostics';
import { hasInvalidEmbeddedIid } from './identifier';
import { enrichOutcome } from './outcome';
import { createRunPageCache, type RunPageCache } from './page-cache';
import { createEnrichmentPluginRegistry } from './plugin-registry';
import type { EnrichmentPlugin } from './plugins';
import { ProviderHttpError } from './plugins/providers/__shared__/http';
import {
	isOpenGraphHttpError,
	type OpenGraphFetchError,
} from './plugins/providers/__shared__/page-fetch-error';
import { isSharedPageConsumer } from './plugins/providers/__shared__/shared-page';
import { canonicalizeEnrichmentSlugs } from './slug-aliases';
import {
	BUDGET_EXHAUSTED_ERROR_CLASS,
	type EnrichmentArtifact,
	type EnrichmentEngine,
	type EnrichmentEngineConfig,
	type EnrichmentRequest,
	type EnrichmentRunResult,
	enrichmentRequestSchema,
	type PluginExecutionError,
	type PluginExecutionErrorCode,
	type ProviderHttpErrorDetails,
} from './types';

export type {
	EnrichmentPluginRegistry,
	RegisterPluginOptions,
	ResolvePluginsResult,
} from './plugin-registry';
export { createEnrichmentPluginRegistry } from './plugin-registry';
export type { EnrichmentEngine, EnrichmentEngineConfig, EnrichRunOptions } from './types';
export const DEFAULT_ENRICHMENT_CONCURRENCY = 5;
export const DEFAULT_ENRICHMENT_TIMEOUT_MS = 10_000;

export function createEnrichmentEngine(config: EnrichmentEngineConfig = {}): EnrichmentEngine {
	if (
		config.identity &&
		(!config.identity.fingerprint || config.identity.fingerprint.trim().length === 0)
	) {
		throw new Error('EnrichmentEngineConfig.identity.fingerprint must be a non-empty string');
	}
	const now = config.now ?? (() => new Date().toISOString());
	const registry = createEnrichmentPluginRegistry(config.plugins ?? []);
	const classificationRegistry = config.classifications ?? createDefaultClassificationRegistry();
	const engine: EnrichmentEngine = {
		registerPlugin: (plugin, options) => registry.register(plugin, options),
		unregisterPlugin: (id) => registry.unregister(id),
		listPlugins: () => registry.list(),
		resolvePlugins: (request) => registry.resolve(request),
		enrichOutcome: (request, options) => enrichOutcome(engine, request, options),
		async enrich(request, options) {
			if (hasInvalidEmbeddedIid(request.input)) {
				config.logger?.debug('Ignoring invalid embedded IID for enrichment hints.', {
					source: 'jsonLd.identifier',
				});
			}
			const parsedRequest = enrichmentRequestSchema.parse(request);
			const startedAt = now();
			const startedAtMs = Date.now();
			const resolved = registry.resolve(parsedRequest);
			const skipped = [...resolved.skipped];
			const errors: PluginExecutionError[] = [];
			const applicable: EnrichmentPlugin[] = [];
			for (const plugin of resolved.plugins) {
				const support = await runWithSignal(async () => plugin.supports(parsedRequest));
				if (support.kind === 'success') {
					if (support.value) applicable.push(plugin);
					else skipped.push({ pluginId: plugin.id, reason: 'not_applicable' });
				} else {
					errors.push(
						createPluginError(
							plugin.id,
							'internal_error',
							`supports() failed: ${getErrorMessage(outcomeError(support))}`,
							false
						)
					);
				}
			}
			const concurrency = Math.max(
				1,
				parsedRequest.concurrency ?? config.concurrency ?? DEFAULT_ENRICHMENT_CONCURRENCY
			);
			const timeoutMs = Math.max(
				1,
				parsedRequest.timeoutMs ?? config.timeoutMs ?? DEFAULT_ENRICHMENT_TIMEOUT_MS
			);
			const consumers = await pageConsumers(applicable, parsedRequest, config, options?.signal);
			const pages = createRunPageCache({ consumers });
			const workItems = applicable.map(
				(plugin): PluginWorkItem => ({
					plugin,
					state: {
						startedAtMs: 0,
						durationMs: 0,
						timingRecorded: false,
						cacheHit: false,
						cacheMiss: false,
					},
				})
			);
			// Domain cancellation is classified per plugin, including queued work. The pool
			// itself must finish collecting those results instead of rejecting the run.
			const results = await forEachBounded(
				workItems,
				(item) =>
					executePluginWorkItem({
						item,
						request: parsedRequest,
						config,
						now,
						classificationRegistry,
						pages,
						timeoutMs,
						signal: options?.signal,
					}),
				{ concurrency }
			);
			const artifacts: EnrichmentArtifact[] = [];
			for (const [index, outer] of results.entries()) {
				const item = workItems[index]!;
				const outcome = outer.kind === 'success' ? outer.value : outer;
				if (outcome.kind === 'success') {
					errors.push(...outcome.value.validationErrors);
					artifacts.push(...filterArtifactsForRequest(outcome.value.artifacts, parsedRequest));
				} else if (outcome.kind === 'timeout') {
					errors.push(
						createPluginError(
							item.plugin.id,
							'timeout',
							`Plugin timed out after ${timeoutMs}ms`,
							true
						)
					);
				} else {
					errors.push(toPluginExecutionError(item.plugin.id, outcomeError(outcome), config.random));
				}
			}
			return {
				status: resolveRunStatus(artifacts.length, errors.length),
				artifacts,
				errors,
				skipped,
				timings: {
					startedAt,
					finishedAt: now(),
					durationMs: Math.max(0, Date.now() - startedAtMs),
					perPluginMs: Object.fromEntries(
						workItems.map(({ plugin, state }) => [plugin.id, state.durationMs])
					),
					cacheHits: workItems.filter(({ state }) => state.cacheHit).length,
					cacheMisses: workItems.filter(({ state }) => state.cacheMiss).length,
				},
				traceId: parsedRequest.traceId,
			};
		},
	};
	return engine;
}

function outcomeError(outcome: Exclude<Outcome<unknown>, { kind: 'success' }>): unknown {
	switch (outcome.kind) {
		case 'failure':
		case 'defect':
			return outcome.error;
		case 'interrupted':
			return outcome.reason ?? new Error('Plugin execution was interrupted.');
		case 'timeout':
			return new Error('Plugin execution timed out.');
	}
}

function pluginCacheKey(
	plugin: EnrichmentPlugin,
	request: EnrichmentRequest,
	config: EnrichmentEngineConfig
): string {
	return buildCacheKey(
		plugin.id,
		request.input,
		plugin.version ?? (config.identity ? { identity: config.identity.fingerprint } : undefined)
	);
}

/** Cache-served page plugins must not widen the shared fetch's body or redirect policy. */
async function pageConsumers(
	plugins: readonly EnrichmentPlugin[],
	request: EnrichmentRequest,
	config: EnrichmentEngineConfig,
	signal?: AbortSignal
): Promise<string[]> {
	const cache = config.cache ? toCancellableCacheAdapter(config.cache) : undefined;
	const consumers: string[] = [];
	for (const plugin of plugins.filter((candidate) => isSharedPageConsumer(candidate.id))) {
		if (!cache || toTtlMs(plugin.TTL) === undefined) {
			consumers.push(plugin.id);
			continue;
		}
		const entry = await runWithSignal(
			(childSignal) => cache.get(pluginCacheKey(plugin, request, config), { signal: childSignal }),
			{ signal }
		);
		if (entry.kind !== 'success' || !entry.value || !isCachedEntryFresh(entry.value))
			consumers.push(plugin.id);
	}
	return consumers;
}

type PluginExecutionState = {
	startedAtMs: number;
	durationMs: number;
	timingRecorded: boolean;
	cacheHit: boolean;
	cacheMiss: boolean;
};
type PluginWorkItem = { plugin: EnrichmentPlugin; state: PluginExecutionState };
type ExecutePluginSuccess = {
	artifacts: EnrichmentArtifact[];
	validationErrors: PluginExecutionError[];
};
type ExecuteParams = {
	item: PluginWorkItem;
	request: EnrichmentRequest;
	config: EnrichmentEngineConfig;
	now: () => string;
	classificationRegistry: ClassificationRegistry;
	pages: RunPageCache;
	timeoutMs: number;
	signal?: AbortSignal;
};
type PreparedExecution = {
	result: ExecutePluginSuccess;
	cacheWrite?: {
		cache: ReturnType<typeof toCancellableCacheAdapter>;
		key: string;
		entry: CachedEntry;
		ttlMs: number;
	};
};

async function executePluginWorkItem(
	params: ExecuteParams
): Promise<Outcome<ExecutePluginSuccess>> {
	const { state, plugin } = params.item;
	state.startedAtMs = Date.now();
	try {
		const outcome = await runWithSignal((signal) => preparePluginExecution(params, signal), {
			signal: params.signal,
		});
		if (outcome.kind !== 'success') return outcome;
		const { result, cacheWrite } = outcome.value;
		if (cacheWrite) {
			// Cancellation detaches even a legacy, signal-unaware adapter, retaining the
			// normalized provider output. All eventual write rejections are observed.
			const write = await runWithSignal(
				(signal) =>
					cacheWrite.cache.set(cacheWrite.key, cacheWrite.entry, cacheWrite.ttlMs, { signal }),
				{ signal: params.signal }
			);
			if (write.kind === 'failure' || write.kind === 'defect') {
				params.config.logger?.warn('Cache set failed for enrichment plugin.', {
					pluginId: plugin.id,
					error: redactProviderDiagnostic(getErrorMessage(write.error)),
				});
			}
		}
		return { kind: 'success', value: result };
	} finally {
		if (!state.timingRecorded) recordPluginDuration(state);
	}
}

async function preparePluginExecution(
	params: ExecuteParams,
	signal: AbortSignal
): Promise<PreparedExecution> {
	const { plugin, state } = params.item;
	const { config } = params;
	const ttlMs = toTtlMs(plugin.TTL);
	const cache = config.cache ? toCancellableCacheAdapter(config.cache) : undefined;
	const key =
		cache && ttlMs !== undefined ? pluginCacheKey(plugin, params.request, config) : undefined;
	if (cache && key) {
		let cachedEntry: CachedEntry | null = null;
		try {
			cachedEntry = await cache.get(key, { signal });
		} catch (error) {
			signal.throwIfAborted();
			config.logger?.warn('Cache get failed for enrichment plugin.', {
				pluginId: plugin.id,
				error: redactProviderDiagnostic(getErrorMessage(error)),
			});
		}
		signal.throwIfAborted();
		if (cachedEntry && isCachedEntryFresh(cachedEntry)) {
			state.cacheHit = true;
			const artifacts = cachedEntry.artifacts.map((artifact) => ({
				artifact_type: artifact.artifact_type,
				data: { ...artifact.data },
				meta: {
					...artifact.meta,
					pluginId: plugin.id,
					fromCache: true,
					cachedAt: cachedEntry.cachedAt,
				},
			}));
			recordPluginDuration(state);
			observeArtifactCacheHit(plugin, params.request, artifacts.length);
			return {
				result: normalizeArtifacts({
					plugin,
					artifacts,
					classificationRegistry: params.classificationRegistry,
					now: params.now,
				}),
			};
		}
		state.cacheMiss = true;
		if (cachedEntry) {
			try {
				await cache.remove(key, { signal });
			} catch {
				/* stale entry cleanup is best effort */
			}
			signal.throwIfAborted();
		}
	}
	signal.throwIfAborted();
	state.startedAtMs = Date.now();
	state.timingRecorded = false;
	let artifacts: EnrichmentArtifact[];
	try {
		artifacts = await withTimeout(
			async (pluginSignal) =>
				plugin.enrich(params.request, {
					now: params.now,
					signal: pluginSignal,
					deadlineAtMs: Date.now() + params.timeoutMs,
					logger: config.logger,
					secrets: config.secrets,
					network: config.network,
					pages: params.pages,
					...(config.identity ? { identity: config.identity } : {}),
				}),
			params.timeoutMs
		)(signal);
	} finally {
		recordPluginDuration(state);
	}
	const result = normalizeArtifacts({
		plugin,
		artifacts,
		classificationRegistry: params.classificationRegistry,
		now: params.now,
	});
	return {
		result,
		...(cache && key && ttlMs
			? {
					cacheWrite: {
						cache,
						key,
						ttlMs,
						entry: { artifacts: result.artifacts, cachedAt: params.now(), ttlMs },
					},
				}
			: {}),
	};
}

type NormalizeArtifactsParams = {
	plugin: EnrichmentPlugin;
	artifacts: EnrichmentArtifact[];
	classificationRegistry: ClassificationRegistry;
	now: () => string;
};

function normalizeArtifacts(params: NormalizeArtifactsParams): ExecutePluginSuccess {
	const artifacts: EnrichmentArtifact[] = [];
	const validationErrors: PluginExecutionError[] = [];

	for (const artifact of params.artifacts) {
		const hydratedMeta = {
			...artifact.meta,
			pluginId: params.plugin.id,
			provider: artifact.meta?.provider ?? params.plugin.id,
			fetchedAt: artifact.meta?.fetchedAt ?? params.now(),
		};
		const candidate: EnrichmentArtifact = {
			artifact_type: artifact.artifact_type,
			data: artifact.data,
			meta: hydratedMeta,
		};
		const dataSchemaResult = params.classificationRegistry.validate(
			candidate.artifact_type,
			candidate.data
		);

		if (!dataSchemaResult.success) {
			validationErrors.push(
				createPluginError(
					params.plugin.id,
					'validation_error',
					`Artifact data validation failed for artifact type "${candidate.artifact_type}".`,
					false
				)
			);
			continue;
		}

		artifacts.push(candidate);
	}

	return {
		artifacts: [...artifacts].sort((left, right) => {
			const classificationDiff = left.artifact_type.localeCompare(right.artifact_type);
			if (classificationDiff !== 0) {
				return classificationDiff;
			}

			return left.meta.provider.localeCompare(right.meta.provider);
		}),
		validationErrors,
	};
}

function filterArtifactsForRequest(
	artifacts: EnrichmentArtifact[],
	request: EnrichmentRequest
): EnrichmentArtifact[] {
	const requestedArtifactTypes = canonicalizeEnrichmentSlugs(
		request.artifactTypes ?? request.artifactClasses
	);
	if (!requestedArtifactTypes || requestedArtifactTypes.length === 0) {
		return artifacts;
	}

	const allowList = new Set(requestedArtifactTypes);
	return artifacts.filter((artifact) => allowList.has(artifact.artifact_type));
}

function resolveRunStatus(
	artifactCount: number,
	errorCount: number
): EnrichmentRunResult['status'] {
	if (errorCount === 0) {
		return 'success';
	}

	if (artifactCount > 0) {
		return 'partial';
	}

	return 'failed';
}

/**
 * Our own pacing slot turned the request away before anything was sent (`slotRefusalOf`): queue
 * full, it cannot start before the deadline, or the deadline passed while it still waited for its
 * lane. Retriable, with a delay (the slot's own hint, clamped, plus jitter that scales with it),
 * under its own identity: the code stays `internal_error` (what a refusal always was, so the error
 * series gain no label value) and `rate_limited` stays reserved for a real upstream throttle.
 *
 * A `RequestSlotTimeoutError` raised after the request was sent is not a refusal: the provider
 * overran, which is a retriable `timeout` like the engine's own timer.
 */
function toSlotErrorOrUndefined(
	pluginId: string,
	error: unknown,
	random: (() => number) | undefined
): PluginExecutionError | undefined {
	const refusal = slotRefusalOf(error);
	if (refusal) {
		return createPluginError(pluginId, 'internal_error', getErrorMessage(error), true, {
			retryAfterMs: Math.round(slotRefusalRetryDelayMs(refusal.retryAfterMs, random)),
			errorClass: BUDGET_EXHAUSTED_ERROR_CLASS,
		});
	}
	if (error instanceof RequestSlotTimeoutError) {
		return createPluginError(pluginId, 'timeout', getErrorMessage(error), true);
	}
	return undefined;
}

function toPluginExecutionError(
	pluginId: string,
	error: unknown,
	random: (() => number) | undefined
): PluginExecutionError {
	const slotError = toSlotErrorOrUndefined(pluginId, error, random);
	if (slotError) return slotError;

	if (error instanceof ProviderHttpError) {
		return classifyProviderHttpError(pluginId, error);
	}

	// The page fetch's own HTTP failures (429, 5xx, ...) carry their status and Retry-After like a
	// ProviderHttpError, so they are not guessed from the message.
	if (isOpenGraphHttpError(error)) {
		return classifyOpenGraphHttpError(pluginId, error, error.httpStatus);
	}

	const message = getErrorMessage(error);
	const lowered = message.toLowerCase();

	if (lowered.includes('rate limit') || lowered.includes('429')) {
		return createPluginError(pluginId, 'rate_limited', message, true);
	}

	if (
		lowered.includes('auth') ||
		lowered.includes('unauthorized') ||
		lowered.includes('forbidden')
	) {
		return createPluginError(pluginId, 'auth_failed', message, false);
	}

	if (lowered.includes('upstream') || lowered.includes('fetch') || lowered.includes('http')) {
		return createPluginError(pluginId, 'upstream_error', message, true);
	}

	return createPluginError(pluginId, 'internal_error', message, false);
}

function classifyProviderHttpError(
	pluginId: string,
	error: ProviderHttpError
): PluginExecutionError {
	const details: ProviderHttpErrorDetails = {
		status: error.status,
		...(error.retryAfterMs === undefined ? {} : { retryAfterMs: error.retryAfterMs }),
		errorClass: error.errorClass,
	};

	// `rate_limited` is the class a plugin gives a provider's own throttle response (MusicBrainz 503).
	if (error.status === 429 || error.errorClass === RATE_LIMITED_KIND) {
		return createPluginError(pluginId, 'rate_limited', error.message, true, details);
	}

	if (error.status === 401 || error.status === 403) {
		return createPluginError(pluginId, 'auth_failed', error.message, false, details);
	}

	if (error.status >= 400 && error.status < 500) {
		return createPluginError(pluginId, 'upstream_error', error.message, false, details);
	}

	return createPluginError(pluginId, 'upstream_error', error.message, true, details);
}

function classifyOpenGraphHttpError(
	pluginId: string,
	error: OpenGraphFetchError,
	status: number
): PluginExecutionError {
	const details: ProviderHttpErrorDetails = {
		status,
		...(error.retryAfterMs === undefined ? {} : { retryAfterMs: error.retryAfterMs }),
		errorClass: error.code,
	};
	return createPluginError(
		pluginId,
		status === 429 ? 'rate_limited' : 'upstream_error',
		error.message,
		error.retryable,
		details
	);
}

function createPluginError(
	pluginId: string,
	code: PluginExecutionErrorCode,
	message: string,
	retriable: boolean,
	details?: ProviderHttpErrorDetails
): PluginExecutionError {
	return {
		pluginId,
		code,
		message: redactProviderDiagnostic(message),
		retriable,
		...(details ? { details } : {}),
	};
}

function toTtlMs(ttlSeconds: number | undefined): number | undefined {
	if (typeof ttlSeconds !== 'number' || ttlSeconds <= 0) {
		return undefined;
	}

	return ttlSeconds * 1_000;
}

function recordPluginDuration(state: PluginExecutionState): void {
	state.durationMs = Math.max(0, Date.now() - state.startedAtMs);
	state.timingRecorded = true;
}

function getErrorMessage(error: unknown): string {
	if (error instanceof Error) {
		return error.message;
	}

	if (typeof error === 'string') {
		return error;
	}

	return 'Unknown error';
}
