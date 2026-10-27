import type { ClassificationClassifierError } from '@0xintuition/atom-classification/engine';

type ClassifierErrorSink = (error: ClassificationClassifierError) => unknown | PromiseLike<unknown>;

import type {
	EnrichmentPresetName,
	ProcessingRuntimeCacheFetcher,
	ProcessingRuntimeConfigInput,
} from './config';
import { createProcessingRuntime, type ProcessingRuntimePluginOverrides } from './runtime';

type CacheProvider = 'memory' | 'none' | 'upstash';

export function createTrpcLocalProcessingRuntime(
	env: Record<string, string | undefined>,
	overrides: Omit<ProcessingRuntimeConfigInput, 'env'> & {
		pluginOverrides?: ProcessingRuntimePluginOverrides;
	} = {}
) {
	const provider = readCacheProvider(env.ENRICHMENT_CACHE_PROVIDER);
	const memoryMaxEntries = readPositiveInt(env.ENRICHMENT_MEMORY_CACHE_MAX_ENTRIES);
	const httpTimeoutMs = readPositiveInt(env.ENRICHMENT_CACHE_HTTP_TIMEOUT_MS);

	return createProcessingRuntime(
		{
			env,
			defaultPreset: overrides.defaultPreset,
			cacheProviderResolution: overrides.cacheProviderResolution ?? 'auto-from-credentials',
			upstashCredentialFallback: overrides.upstashCredentialFallback ?? 'none',
			/**
			 * HEAD parity: local classification has no cache unless this exact opt-in
			 * is true. Enrichment cache settings retain their ENRICHMENT_* namespace.
			 */
			classificationCache:
				overrides.classificationCache ??
				(isTrue(env.CLASSIFICATION_CACHE_ENABLED) ? 'enabled' : 'disabled'),
			cache: {
				provider: overrides.cache?.provider ?? provider,
				memoryMaxEntries: overrides.cache?.memoryMaxEntries ?? memoryMaxEntries,
				classificationMemoryMaxEntries: overrides.cache?.classificationMemoryMaxEntries,
				httpTimeoutMs: overrides.cache?.httpTimeoutMs ?? httpTimeoutMs,
			},
			enrichment: overrides.enrichment,
			classification: {
				...overrides.classification,
				onClassifierError: overrides.classification?.onClassifierError,
			},
			logger: overrides.logger,
			now: overrides.now,
			random: overrides.random,
			cacheFetcher: overrides.cacheFetcher,
			...(overrides.secrets === undefined ? {} : { secrets: overrides.secrets }),
		},
		{ pluginOverrides: overrides.pluginOverrides }
	);
}

export type AtomServicesProcessingRuntimeOptions = {
	env: Record<string, string | undefined>;
	defaultPreset?: EnrichmentPresetName;
	cacheProvider?: CacheProvider;
	memoryCacheMaxEntries?: number;
	classificationMemoryCacheMaxEntries?: number;
	classificationResolverCacheTtlMs?: number;
	cacheHttpTimeoutMs?: number;
	now?: () => string;
	random?: () => number;
	cacheFetcher?: ProcessingRuntimeCacheFetcher;
	logger?: ProcessingRuntimeConfigInput['logger'];
	onClassifierError?: ClassifierErrorSink;
	pluginOverrides?: ProcessingRuntimePluginOverrides;
	secrets?: Readonly<Record<string, string>>;
};

export function createAtomServicesProcessingRuntime(options: AtomServicesProcessingRuntimeOptions) {
	const env = options.env;
	return createProcessingRuntime(
		{
			env,
			defaultPreset: options.defaultPreset ?? readPresetName(env.ATOM_SERVICES_DEFAULT_PRESET),
			cacheProviderResolution: 'explicit',
			upstashCredentialFallback: 'memory',
			classificationCache: 'enabled',
			cache: {
				provider: options.cacheProvider ?? readCacheProvider(env.ATOM_SERVICES_CACHE_PROVIDER),
				memoryMaxEntries:
					options.memoryCacheMaxEntries ??
					readPositiveInt(env.ATOM_SERVICES_MEMORY_CACHE_MAX_ENTRIES),
				classificationMemoryMaxEntries:
					options.classificationMemoryCacheMaxEntries ??
					readPositiveInt(env.ATOM_SERVICES_CLASSIFICATION_MEMORY_CACHE_MAX_ENTRIES),
				httpTimeoutMs:
					options.cacheHttpTimeoutMs ?? readPositiveInt(env.ATOM_SERVICES_CACHE_HTTP_TIMEOUT_MS),
			},
			classification: {
				resolverCacheTtlMs:
					options.classificationResolverCacheTtlMs ??
					readPositiveInt(env.ATOM_SERVICES_CLASSIFICATION_RESOLVER_CACHE_TTL_MS),
				onClassifierError: options.onClassifierError,
			},
			logger: options.logger,
			now: options.now,
			random: options.random,
			cacheFetcher: options.cacheFetcher,
			...(options.secrets === undefined ? {} : { secrets: options.secrets }),
		},
		{ pluginOverrides: options.pluginOverrides }
	);
}

function readPresetName(value: string | undefined): EnrichmentPresetName | undefined {
	const normalized = value?.trim().toLowerCase();
	return normalized ? (normalized as EnrichmentPresetName) : undefined;
}

function readCacheProvider(value: string | undefined): CacheProvider | undefined {
	const normalized = value?.trim().toLowerCase();
	return normalized ? (normalized as CacheProvider) : undefined;
}

function readPositiveInt(value: string | undefined): number | undefined {
	if (!value?.trim()) {
		return undefined;
	}

	const parsed = Number.parseInt(value, 10);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function isTrue(value: string | undefined): boolean {
	return value?.trim().toLowerCase() === 'true';
}
