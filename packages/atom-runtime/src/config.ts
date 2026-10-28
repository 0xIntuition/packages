import type { ClassificationClassifierError } from '@0xintuition/atom-classification/engine';
import {
	type ClassificationResolverExecutionError,
	DEFAULT_CLASSIFICATION_HOOK_TIMEOUT_MS,
	DEFAULT_CLASSIFICATION_RESOLVER_CACHE_TTL_MS,
	DEFAULT_CLASSIFICATION_RESOLVER_TIMEOUT_MS,
} from '@0xintuition/atom-classification/engine';
import type { ClassificationLogger as Logger } from '@0xintuition/atom-classification/plugins';
import {
	DEFAULT_ENRICHMENT_CONCURRENCY,
	DEFAULT_ENRICHMENT_TIMEOUT_MS,
} from '@0xintuition/atom-enrichment/engine';
import { z } from 'zod/v4';

type ClassifierErrorSink = (error: ClassificationClassifierError) => unknown | PromiseLike<unknown>;

export const enrichmentPresetNameSchema = z.enum([
	'default',
	'company',
	'music',
	'crypto',
	'academic',
	'custom',
]);

export type EnrichmentPresetName = z.infer<typeof enrichmentPresetNameSchema>;

const envSchema = z.record(z.string(), z.union([z.string(), z.undefined()]));
const loggerSchema = z.custom<Logger>(isLogger, {
	message: 'logger must implement debug, warn, and error',
});
const classifierSinkSchema = z.custom<ClassifierErrorSink>((value) => typeof value === 'function', {
	message: 'classification.onClassifierError must be a classifier-error sink function',
});
const resolverSinkSchema = z.custom<(error: ClassificationResolverExecutionError) => void>(
	(value) => typeof value === 'function'
);
const nowSchema = z.custom<() => string>((value) => typeof value === 'function', {
	message: 'now must be a function',
});
const randomSchema = z.custom<() => number>((value) => typeof value === 'function', {
	message: 'random must be a function',
});
export type ProcessingRuntimeCacheFetcher = (
	input: string | URL | Request,
	init?: RequestInit
) => Promise<Response>;

const cacheFetcherSchema = z.custom<ProcessingRuntimeCacheFetcher>(
	(value) => typeof value === 'function',
	{
		message: 'cacheFetcher must be a function',
	}
);

export const cacheProviderResolutionSchema = z.enum(['explicit', 'auto-from-credentials']);
export const upstashCredentialFallbackSchema = z.enum(['none', 'memory']);
export const classificationCacheSchema = z.enum(['enabled', 'disabled']);

export const processingRuntimeConfigSchema = z
	.object({
		env: envSchema,
		defaultPreset: enrichmentPresetNameSchema,
		cacheProviderResolution: cacheProviderResolutionSchema,
		upstashCredentialFallback: upstashCredentialFallbackSchema,
		classificationCache: classificationCacheSchema,
		cache: z
			.object({
				provider: z.enum(['memory', 'none', 'upstash']),
				memoryMaxEntries: z.number().int().positive(),
				classificationMemoryMaxEntries: z.number().int().positive(),
				httpTimeoutMs: z.number().int().positive(),
			})
			.strict(),
		enrichment: z
			.object({
				concurrency: z.number().int().positive(),
				timeoutMs: z.number().int().positive(),
			})
			.strict(),
		classification: z
			.object({
				hookTimeoutMs: z.number().int().nonnegative(),
				resolverTimeoutMs: z.number().int().positive(),
				resolverCacheTtlMs: z.number().int().nonnegative(),
				autoInit: z.boolean(),
				onClassifierError: classifierSinkSchema.optional(),
				onResolverError: resolverSinkSchema.optional(),
			})
			.strict(),
		logger: loggerSchema.optional(),
		now: nowSchema.optional(),
		random: randomSchema.optional(),
		cacheFetcher: cacheFetcherSchema.optional(),
		secrets: z.record(z.string(), z.string()).optional(),
	})
	.strict()
	.superRefine((config, context) => {
		if (config.cache.provider !== 'upstash') {
			return;
		}

		const rawUrl = config.env.UPSTASH_REDIS_REST_URL?.trim();
		const token = config.env.UPSTASH_REDIS_REST_TOKEN?.trim();
		if (!rawUrl || !token) {
			return;
		}

		try {
			const url = new URL(rawUrl);
			const injectedLoopback =
				config.cacheFetcher !== undefined &&
				url.protocol === 'http:' &&
				url.hostname === '127.0.0.1';
			if (url.protocol !== 'https:' && !injectedLoopback) {
				throw new Error('invalid protocol');
			}
		} catch {
			context.addIssue({
				code: 'custom',
				message:
					'Upstash URL must be a parseable https URL. An injected cacheFetcher may use http://127.0.0.1.',
				path: ['env', 'UPSTASH_REDIS_REST_URL'],
			});
		}
	});

export type ProcessingRuntimeConfig = z.infer<typeof processingRuntimeConfigSchema>;

export type ProcessingRuntimeConfigInput = {
	env: Record<string, string | undefined>;
	defaultPreset?: EnrichmentPresetName;
	cacheProviderResolution?: z.infer<typeof cacheProviderResolutionSchema>;
	upstashCredentialFallback?: z.infer<typeof upstashCredentialFallbackSchema>;
	classificationCache?: z.infer<typeof classificationCacheSchema>;
	cache?: {
		provider?: 'memory' | 'none' | 'upstash';
		memoryMaxEntries?: number;
		classificationMemoryMaxEntries?: number;
		httpTimeoutMs?: number;
	};
	enrichment?: {
		concurrency?: number;
		timeoutMs?: number;
	};
	classification?: {
		hookTimeoutMs?: number;
		resolverTimeoutMs?: number;
		resolverCacheTtlMs?: number;
		autoInit?: boolean;
		/** Optional error observer; defaults to a no-op. */
		onClassifierError?: ClassifierErrorSink;
		onResolverError?: (error: ClassificationResolverExecutionError) => void;
	};
	logger?: Logger;
	now?: () => string;
	random?: () => number;
	cacheFetcher?: ProcessingRuntimeCacheFetcher;
	secrets?: Readonly<Record<string, string>>;
};

const DEFAULT_MEMORY_MAX_ENTRIES = 500;
const DEFAULT_HTTP_TIMEOUT_MS = 1_500;

export const PROCESSING_SECRET_ENV_KEYS = [
	'BRANDFETCH_API_KEY',
	'CANOPY_API_KEY',
	'COINGECKO_API_KEY',
	'ETHERSCAN_API_KEY',
	'GITHUB_TOKEN',
	'GOOGLE_PLACES_API_KEY',
	'PODCAST_INDEX_API_KEY',
	'PODCAST_INDEX_API_SECRET',
	'SPOTIFY_CLIENT_ID',
	'SPOTIFY_CLIENT_SECRET',
	'TMDB_API_KEY',
	'UPSTASH_REDIS_REST_TOKEN',
	'X_BEARER_TOKEN',
	'YOUTUBE_API_KEY',
] as const;

export function resolveProcessingRuntimeConfig(
	input: ProcessingRuntimeConfigInput
): ProcessingRuntimeConfig {
	const env = pickProcessingEnv(input.env);
	const cacheProviderResolution = input.cacheProviderResolution ?? 'explicit';
	const explicitProvider = normalizeCacheProvider(input.cache?.provider);
	const provider =
		explicitProvider ??
		(cacheProviderResolution === 'auto-from-credentials' && hasUpstashCredentials(env)
			? 'upstash'
			: 'memory');
	const memoryMaxEntries = input.cache?.memoryMaxEntries ?? DEFAULT_MEMORY_MAX_ENTRIES;

	return processingRuntimeConfigSchema.parse({
		env,
		defaultPreset: input.defaultPreset ?? 'default',
		cacheProviderResolution,
		upstashCredentialFallback: input.upstashCredentialFallback ?? 'memory',
		classificationCache: input.classificationCache ?? 'enabled',
		cache: {
			provider,
			memoryMaxEntries,
			classificationMemoryMaxEntries:
				input.cache?.classificationMemoryMaxEntries ?? memoryMaxEntries,
			httpTimeoutMs: input.cache?.httpTimeoutMs ?? DEFAULT_HTTP_TIMEOUT_MS,
		},
		enrichment: {
			concurrency: input.enrichment?.concurrency ?? DEFAULT_ENRICHMENT_CONCURRENCY,
			timeoutMs: input.enrichment?.timeoutMs ?? DEFAULT_ENRICHMENT_TIMEOUT_MS,
		},
		classification: {
			hookTimeoutMs: input.classification?.hookTimeoutMs ?? DEFAULT_CLASSIFICATION_HOOK_TIMEOUT_MS,
			resolverTimeoutMs:
				input.classification?.resolverTimeoutMs ?? DEFAULT_CLASSIFICATION_RESOLVER_TIMEOUT_MS,
			resolverCacheTtlMs:
				input.classification?.resolverCacheTtlMs ?? DEFAULT_CLASSIFICATION_RESOLVER_CACHE_TTL_MS,
			autoInit: input.classification?.autoInit ?? true,
			onClassifierError: input.classification?.onClassifierError ?? (() => {}),
			onResolverError: input.classification?.onResolverError,
		},
		logger: input.logger,
		now: input.now,
		random: input.random,
		cacheFetcher: input.cacheFetcher,
		...(input.secrets === undefined ? {} : { secrets: { ...input.secrets } }),
	});
}

function normalizeCacheProvider(value: string | undefined): string | undefined {
	if (typeof value !== 'string') {
		return undefined;
	}

	const normalized = value.trim().toLowerCase();
	return normalized;
}

function hasUpstashCredentials(env: Record<string, string | undefined>): boolean {
	return Boolean(env.UPSTASH_REDIS_REST_URL?.trim() && env.UPSTASH_REDIS_REST_TOKEN?.trim());
}

function isLogger(value: unknown): value is Logger {
	if (!value || typeof value !== 'object') {
		return false;
	}
	const candidate = value as Partial<Logger>;
	return (
		typeof candidate.debug === 'function' &&
		typeof candidate.warn === 'function' &&
		typeof candidate.error === 'function'
	);
}

/** Only these provider settings reach the shared factories. */
export function pickProcessingEnv(
	env: Record<string, string | undefined>
): Record<string, string | undefined> {
	const keys = [
		...PROCESSING_SECRET_ENV_KEYS,
		'UPSTASH_REDIS_REST_URL',
		'SPOTIFY_MARKET',
		'MUSICBRAINZ_USER_AGENT',
	];
	return Object.fromEntries(
		keys.filter((key) => env[key] !== undefined).map((key) => [key, env[key]])
	);
}
