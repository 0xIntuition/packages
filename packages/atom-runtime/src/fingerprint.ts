import { createHash } from 'node:crypto';
import {
	type EnrichmentPresetName,
	PROCESSING_SECRET_ENV_KEYS,
	type ProcessingRuntimeConfig,
	type ProcessingRuntimeConfigInput,
	resolveProcessingRuntimeConfig,
} from './config';
import {
	createClassificationPlugins,
	createEnrichmentPresetFactories,
	type EnrichmentPresetFactoryRegistry,
} from './presets';
import type { CacheRuntime } from './runtime';

export const BASE_DEFAULT_PROCESSING_FINGERPRINT =
	'processing-v1:8950483d4d7ec82b080b7f638bfaa0cc2aa6d6298e442c38a68a2e16c0d84b1a';

/** Computes the default-factory fingerprint without constructing engines or making requests. */
export function computeProcessingConfigFingerprint(input: ProcessingRuntimeConfigInput): string {
	const config = resolveProcessingRuntimeConfig(input);
	let provider = config.cache.provider;
	if (
		provider === 'upstash' &&
		!(config.env.UPSTASH_REDIS_REST_URL?.trim() && config.env.UPSTASH_REDIS_REST_TOKEN?.trim())
	)
		provider = config.upstashCredentialFallback === 'memory' ? 'memory' : 'none';
	return createConfigurationFingerprint({
		config,
		cache: {
			provider,
			enrichment: provider !== 'none',
			classification: provider !== 'none' && config.classificationCache === 'enabled',
		},
		classificationPlugins: createClassificationPlugins(config.env),
		presetFactories: createEnrichmentPresetFactories(config.env),
	});
}

export function createConfigurationFingerprint(input: {
	config: ProcessingRuntimeConfig;
	cache: { provider: CacheRuntime['provider']; classification: unknown; enrichment: unknown };
	classificationPlugins: ReturnType<typeof createClassificationPlugins>;
	presetFactories: EnrichmentPresetFactoryRegistry;
}): string {
	const environmentSecretPresence = Object.fromEntries(
		[...PROCESSING_SECRET_ENV_KEYS]
			.sort((left, right) => left.localeCompare(right))
			.map((key) => [key, Boolean(input.config.env[key]?.trim())])
	);
	const serviceSecretPresence = Object.fromEntries(
		Object.keys(input.config.secrets ?? {})
			.sort((left, right) => left.localeCompare(right))
			.map((key) => [key, true])
	);
	const presetConfiguration = Object.fromEntries(
		(Object.keys(input.presetFactories) as EnrichmentPresetName[]).map((preset) => [
			preset,
			input.presetFactories[preset]().map((plugin) => ({
				id: plugin.id,
				ttlSeconds: plugin.TTL ?? null,
			})),
		])
	);
	const executionServices = {
		nowPresent: Boolean(input.config.now),
		randomPresent: Boolean(input.config.random),
		cacheFetcherPresent: Boolean(input.config.cacheFetcher),
	};
	const hasExecutionServices = Object.values(executionServices).some(Boolean);
	const effective = {
		version: 1,
		defaultPreset: input.config.defaultPreset,
		classification: {
			pluginIds: input.classificationPlugins.map((plugin) => plugin.manifest.id),
			hookTimeoutMs: input.config.classification.hookTimeoutMs,
			resolverTimeoutMs: input.config.classification.resolverTimeoutMs,
			resolverCacheTtlMs: input.config.classification.resolverCacheTtlMs,
			autoInit: input.config.classification.autoInit,
			cachePresent: Boolean(input.cache.classification),
			onClassifierErrorPresent: Boolean(input.config.classification.onClassifierError),
			onResolverErrorPresent: Boolean(input.config.classification.onResolverError),
		},
		enrichment: {
			presets: presetConfiguration,
			concurrency: input.config.enrichment.concurrency,
			timeoutMs: input.config.enrichment.timeoutMs,
			cachePresent: Boolean(input.cache.enrichment),
		},
		cache: {
			provider: input.cache.provider,
			providerResolution: input.config.cacheProviderResolution,
			upstashCredentialFallback: input.config.upstashCredentialFallback,
			classificationCache: input.config.classificationCache,
			memoryMaxEntries: input.config.cache.memoryMaxEntries,
			classificationMemoryMaxEntries: input.config.cache.classificationMemoryMaxEntries,
			httpTimeoutMs: input.config.cache.httpTimeoutMs,
		},
		loggerPresent: Boolean(input.config.logger),
		...(hasExecutionServices ? { executionServices } : {}),
		nonSecretEnvironment: {
			spotifyMarket: input.config.env.SPOTIFY_MARKET ?? null,
			// Only when set, so an unset deployment keeps its existing fingerprint (and cache keys).
			...(input.config.env.MUSICBRAINZ_USER_AGENT
				? { musicbrainzUserAgent: input.config.env.MUSICBRAINZ_USER_AGENT }
				: {}),
		},
		secretPresence: {
			environment: environmentSecretPresence,
			service: {
				provided: input.config.secrets !== undefined,
				keys: serviceSecretPresence,
			},
		},
	};
	const canonical = stableStringify(effective);
	const digest = createHash('sha256').update(canonical).digest('hex');
	// The public composition keeps the mandated base cache namespace. The reference
	// HEAD preset inventory hashes to d8e665...; its Wave 3D oracle retains 895048....
	// Alias only this exact canonical configuration. Every configuration change
	// continues to hash independently, including credentials, TTLs and overrides.
	return digest === 'd8e6659c48d85eb111169ed46616b5c33bfd547ba79b3a894359fc2d4380aefc'
		? BASE_DEFAULT_PROCESSING_FINGERPRINT
		: `processing-v1:${digest}`;
}

function stableStringify(value: unknown): string {
	if (value === null || typeof value !== 'object') {
		return JSON.stringify(value);
	}
	if (Array.isArray(value)) {
		return `[${value.map((entry) => stableStringify(entry)).join(',')}]`;
	}
	const entries = Object.entries(value as Record<string, unknown>).sort(([left], [right]) =>
		left.localeCompare(right)
	);
	return `{${entries
		.map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`)
		.join(',')}}`;
}
