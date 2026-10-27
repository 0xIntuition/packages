import {
	type AtomClassificationPlugin,
	type ClassificationCacheAdapter,
	type ClassificationEngine,
	createClassificationEngine,
	createMemoryClassificationCacheAdapter,
} from '@0xintuition/atom-classification';
import {
	createEnrichmentEngine,
	createMemoryCacheAdapter,
	type CacheAdapter as EnrichmentCacheAdapter,
	type EnrichmentEngine,
	type EnrichmentEngineConfig,
	type EnrichmentPlugin,
} from '@0xintuition/atom-enrichment';

import {
	createUpstashCacheAdapterFromEnv,
	createUpstashClassificationCacheAdapterFromEnv,
} from './adapters/upstash';
import {
	type EnrichmentPresetName,
	type ProcessingRuntimeConfig,
	type ProcessingRuntimeConfigInput,
	resolveProcessingRuntimeConfig,
} from './config';
import { createConfigurationFingerprint } from './fingerprint';
import {
	createClassificationPlugins,
	createEnrichmentPresetFactories,
	type EnrichmentPresetFactoryRegistry,
} from './presets';

export type CacheRuntime = {
	enrichment: EnrichmentCacheAdapter | undefined;
	classification: ClassificationCacheAdapter | undefined;
	provider: 'memory' | 'none' | 'upstash';
	warnings: string[];
};

export type ProcessingRuntime = ReturnType<typeof createProcessingRuntime>;

type PluginOverride<T> = readonly T[] | (() => readonly T[]);

export type ProcessingRuntimePluginOverrides = {
	classification?: PluginOverride<AtomClassificationPlugin>;
	enrichment?: Partial<Record<EnrichmentPresetName, PluginOverride<EnrichmentPlugin>>>;
};

export type CreateProcessingRuntimeOptions = {
	network?: EnrichmentEngineConfig['network'];
	pluginOverrides?: ProcessingRuntimePluginOverrides;
};

export const SHARED_ENRICHMENT_REGISTRY_ERROR =
	'Published atom-runtime enrichment engines have immutable plugin registries.';

export type ProcessingRuntimeComposition = {
	config: ProcessingRuntimeConfigInput;
	runtime?: {
		fetch?: ProcessingRuntimeConfig['cacheFetcher'];
		logger?: ProcessingRuntimeConfig['logger'];
		now?: () => string;
		random?: () => number;
	};
	overrides?: ProcessingRuntimePluginOverrides;
	network?: EnrichmentEngineConfig['network'];
};

export function createProcessingRuntime(
	input: ProcessingRuntimeConfigInput | ProcessingRuntimeComposition,
	options: CreateProcessingRuntimeOptions = {}
) {
	if ('config' in input) {
		options = {
			...options,
			network: input.network ?? options.network,
			pluginOverrides: input.overrides ?? options.pluginOverrides,
		};
		input = {
			...input.config,
			logger: input.runtime?.logger ?? input.config.logger,
			now: input.runtime?.now ?? input.config.now,
			random: input.runtime?.random ?? input.config.random,
			cacheFetcher: input.runtime?.fetch ?? input.config.cacheFetcher,
		};
	}
	const config = resolveProcessingRuntimeConfig(input);
	const cache = createCacheRuntime(config);
	const classificationPlugins = resolvePluginOverride(options.pluginOverrides?.classification, () =>
		createClassificationPlugins(config.env)
	);
	const presetFactories = applyEnrichmentPluginOverrides(
		createEnrichmentPresetFactories(config.env),
		options.pluginOverrides?.enrichment
	);
	const presetSummary = createPresetSummary(presetFactories);
	const sharedEnrichmentEngines = new Map<
		EnrichmentPresetName,
		Map<EnrichmentEngineConfig['identity'], EnrichmentEngine>
	>();
	let sharedClassificationEngine: ClassificationEngine | undefined;
	let disposed = false;
	const assertActive = () => {
		if (disposed) throw new Error('Processing runtime is disposed.');
	};
	const classificationOptions = {
		runtime: 'server' as const,
		plugins: classificationPlugins,
		cache: cache.classification,
		resolverCacheTtlMs: config.classification.resolverCacheTtlMs,
		hookTimeoutMs: config.classification.hookTimeoutMs,
		resolverTimeoutMs: config.classification.resolverTimeoutMs,
		autoInit: config.classification.autoInit,
		logger: config.logger,
		...(config.now ? { now: () => new Date(config.now?.() ?? new Date().toISOString()) } : {}),
		...(config.random ? { random: config.random } : {}),
		...(config.secrets === undefined ? {} : { secrets: config.secrets }),
		onClassifierError: config.classification.onClassifierError ?? (() => {}),
		onResolverError: config.classification.onResolverError,
	};
	const enrichmentConfig = (preset: EnrichmentPresetName) => ({
		network: options.network,
		plugins: presetFactories[preset](),
		cache: cache.enrichment,
		concurrency: config.enrichment.concurrency,
		timeoutMs: config.enrichment.timeoutMs,
		logger: config.logger,
		...(config.now ? { now: config.now } : {}),
		...(config.random ? { random: config.random } : {}),
		...(config.secrets === undefined ? {} : { secrets: config.secrets }),
	});
	const fingerprint = createConfigurationFingerprint({
		config,
		cache,
		classificationPlugins,
		presetFactories,
	});

	const classificationEngine = (_preset?: EnrichmentPresetName): ClassificationEngine => {
		assertActive();
		sharedClassificationEngine ??= createClassificationEngine(classificationOptions);
		return sharedClassificationEngine;
	};
	const enrichmentEngine = (
		preset: EnrichmentPresetName = config.defaultPreset,
		identity?: EnrichmentEngineConfig['identity']
	): EnrichmentEngine => {
		assertActive();
		const engines =
			sharedEnrichmentEngines.get(preset) ??
			new Map<EnrichmentEngineConfig['identity'], EnrichmentEngine>();
		const published = engines.get(identity);
		if (published) return published;
		const engine = publishEnrichmentEngine(
			createEnrichmentEngine({ ...enrichmentConfig(preset), identity })
		);
		engines.set(identity, engine);
		sharedEnrichmentEngines.set(preset, engines);
		return engine;
	};
	return {
		classification: {
			engine: classificationEngine,
			createEngine: classificationEngine,
			plugins: classificationPlugins,
			pluginIds: classificationPlugins.map((plugin) => plugin.manifest.id),
		},
		enrichment: {
			engine: enrichmentEngine,
			createEngine: enrichmentEngine,
			presetFactories,
			presetSummary,
			cache: cache.enrichment,
		},
		cache,
		dispose() {
			disposed = true;
			sharedClassificationEngine = undefined;
			sharedEnrichmentEngines.clear();
		},

		fingerprint,
		cacheProvider: cache.provider,
		caches: {
			enrichment: cache.enrichment,
			classification: cache.classification,
		},
		warnings: [...cache.warnings],
		config,
	};
}

export function createCacheRuntime(
	config: ProcessingRuntimeConfig,
	options: {
		fetch?: ProcessingRuntimeConfig['cacheFetcher'];
		logger?: ProcessingRuntimeConfig['logger'];
		providerVariableName?: string;
	} = {}
): CacheRuntime {
	config = { ...config, cacheFetcher: options.fetch ?? config.cacheFetcher };
	if (config.cache.provider === 'none') {
		return {
			enrichment: undefined,
			classification: undefined,
			provider: 'none',
			warnings: [],
		};
	}

	if (config.cache.provider === 'upstash') {
		const hasCredentials = Boolean(
			config.env.UPSTASH_REDIS_REST_URL?.trim() && config.env.UPSTASH_REDIS_REST_TOKEN?.trim()
		);
		if (!hasCredentials) {
			if (config.upstashCredentialFallback === 'none') {
				return {
					enrichment: undefined,
					classification: undefined,
					provider: 'none',
					warnings: [],
				};
			}

			return {
				...createMemoryCaches(config),
				provider: 'memory',
				warnings: [
					`${options.providerVariableName ?? 'ATOM_SERVICES_CACHE_PROVIDER'}=upstash requested, but UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are missing. Falling back to in-memory cache.`,
				],
			};
		}

		const enrichment = createUpstashCacheAdapterFromEnv(config.env, {
			fetcher: config.cacheFetcher as typeof fetch | undefined,
			httpTimeoutMs: config.cache.httpTimeoutMs,
		});
		const classification =
			config.classificationCache === 'enabled'
				? createUpstashClassificationCacheAdapterFromEnv(config.env, {
						fetcher: config.cacheFetcher as typeof fetch | undefined,
						httpTimeoutMs: config.cache.httpTimeoutMs,
					})
				: undefined;
		if (enrichment && (config.classificationCache === 'disabled' || classification)) {
			return { enrichment, classification, provider: 'upstash', warnings: [] };
		}

		throw new Error('Validated Upstash cache configuration could not construct its adapters.');
	}

	return {
		...createMemoryCaches(config),
		provider: 'memory',
		warnings: [],
	};
}

function createMemoryCaches(config: ProcessingRuntimeConfig) {
	const now = config.now ? () => parseNowMs(config.now?.()) : undefined;
	return {
		enrichment: createMemoryCacheAdapter({
			maxEntries: config.cache.memoryMaxEntries,
			...(now ? { now } : {}),
		}),
		classification:
			config.classificationCache === 'enabled'
				? createMemoryClassificationCacheAdapter({
						maxEntries: config.cache.classificationMemoryMaxEntries,
						...(now ? { now } : {}),
					})
				: undefined,
	};
}

function createPresetSummary(
	presetFactories: EnrichmentPresetFactoryRegistry
): Record<EnrichmentPresetName, string[]> {
	return {
		default: presetFactories.default().map((plugin) => plugin.id),
		company: presetFactories.company().map((plugin) => plugin.id),
		music: presetFactories.music().map((plugin) => plugin.id),
		crypto: presetFactories.crypto().map((plugin) => plugin.id),
		academic: presetFactories.academic().map((plugin) => plugin.id),
		custom: presetFactories.custom().map((plugin) => plugin.id),
	};
}

function resolvePluginOverride<T>(
	override: PluginOverride<T> | undefined,
	fallback: () => T[]
): T[] {
	return [...(typeof override === 'function' ? override() : (override ?? fallback()))];
}

function applyEnrichmentPluginOverrides(
	factories: EnrichmentPresetFactoryRegistry,
	overrides: ProcessingRuntimePluginOverrides['enrichment']
): EnrichmentPresetFactoryRegistry {
	if (!overrides) {
		return factories;
	}

	return Object.fromEntries(
		(Object.keys(factories) as EnrichmentPresetName[]).map((preset) => {
			const override = overrides[preset];
			return [
				preset,
				override ? () => resolvePluginOverride(override, factories[preset]) : factories[preset],
			];
		})
	) as EnrichmentPresetFactoryRegistry;
}

function publishEnrichmentEngine(engine: EnrichmentEngine): EnrichmentEngine {
	let published = false;
	const assertMutable = () => {
		if (published) {
			throw new Error(SHARED_ENRICHMENT_REGISTRY_ERROR);
		}
	};
	return Object.freeze({
		registerPlugin: (plugin) => {
			assertMutable();
			engine.registerPlugin(plugin);
		},
		unregisterPlugin: (pluginId) => {
			assertMutable();
			return engine.unregisterPlugin(pluginId);
		},
		listPlugins: () => engine.listPlugins(),
		resolvePlugins: (request) => {
			published = true;
			return engine.resolvePlugins(request);
		},
		enrich: async (request, executionOptions) => {
			published = true;
			return await engine.enrich(request, executionOptions);
		},
	});
}

function parseNowMs(value: string | undefined): number {
	const parsed = Date.parse(value ?? '');
	return Number.isNaN(parsed) ? Date.now() : parsed;
}
