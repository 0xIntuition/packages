import type {
	ProviderName,
	ProviderOperationOf,
} from '@0xintuition/pipeline-runtime/provider-registry';
import { z } from 'zod/v4';
import type { EnrichmentNetworkOptions } from './network';
import type { RunPageCache } from './page-cache';

import {
	classificationSlugLikeSchema,
	type EnrichmentArtifact,
	type EnrichmentRequest,
	type EnrichmentRuntime,
	type PluginRuntime,
	pluginRuntimeSchema,
} from './types';

const semverPattern = /^\d+\.\d+\.\d+(?:[-+][A-Za-z0-9.-]+)?$/;

export const enrichmentPluginManifestSchema = z
	.object({
		id: classificationSlugLikeSchema,
		version: z.string().regex(semverPattern, 'Version must be semantic versioning compatible.'),
		runtime: pluginRuntimeSchema,
		artifactTypes: z.array(classificationSlugLikeSchema).min(1),
		priority: z.number().int().min(0).default(100),
		TTL: z.number().int().min(0).optional(),
	})
	.strict();

export type ParsedEnrichmentPluginManifest = z.infer<typeof enrichmentPluginManifestSchema>;

export type EnrichmentPluginManifest = {
	id: string;
	version: string;
	runtime: PluginRuntime;
	artifactTypes: string[];
	priority?: number;
	TTL?: number;
};

export type EnrichmentPluginLogger = {
	debug(message: string, meta?: Record<string, unknown>): void;
	warn(message: string, meta?: Record<string, unknown>): void;
	error(message: string, meta?: Record<string, unknown>): void;
};

export type { EnrichmentIdentityCapability, EnrichmentIdentityPolicy } from './types';

export type EnrichmentPluginContext = {
	identity?: import('./types').EnrichmentIdentityCapability;
	network?: EnrichmentNetworkOptions;
	now(): string;
	signal: AbortSignal;
	/**
	 * Epoch milliseconds at which the engine aborts this plugin run. Lets a
	 * plugin tell the engine deadline apart from a caller cancelling the whole
	 * enrichment: both abort `signal`, only the first happens at or after this.
	 */
	deadlineAtMs?: number;
	logger?: EnrichmentPluginLogger;
	secrets?: Record<string, string>;
	/**
	 * Page fetches shared by the plugins of this run (see `RunPageCache`). Absent
	 * when a plugin is called outside the engine: plugins then fetch on their own.
	 */
	pages?: RunPageCache;
};

/**
 * How a plugin takes part in provider observability (ENG-16976). The plugin
 * reports its own live requests; this lets the engine report the ones its
 * artifact cache absorbed.
 */
export type EnrichmentPluginObservability = {
	[P in ProviderName]: {
		provider: P;
		/**
		 * The operations a cache hit stands in for, for this request. The `(provider, operation)`
		 * pairing is checked by the compiler. List only operations the registry gives
		 * `cacheOutcomes`; the engine emits one `source=cache` event per operation (and skips,
		 * rather than mint an undeclared series, any whose outcome the registry does not declare).
		 * `hit` when the cached run produced artifacts, `miss` when it cached an empty result.
		 */
		cacheOperations(request: EnrichmentRequest): readonly ProviderOperationOf<P>[];
	};
}[ProviderName];

export type EnrichmentPlugin = EnrichmentPluginManifest & {
	/** Declared by observed providers; absent plugins are not observed. */
	observability?: EnrichmentPluginObservability;
	supports(request: EnrichmentRequest): boolean | Promise<boolean>;
	enrich(request: EnrichmentRequest, ctx: EnrichmentPluginContext): Promise<EnrichmentArtifact[]>;
};

export function defineEnrichmentPlugin<TPlugin extends EnrichmentPlugin>(plugin: TPlugin): TPlugin {
	return plugin;
}

export function validateEnrichmentPluginManifest(
	manifest: unknown
): ParsedEnrichmentPluginManifest {
	return enrichmentPluginManifestSchema.parse(manifest);
}

export function isPluginRuntimeCompatible(
	runtime: EnrichmentRuntime,
	pluginRuntime: PluginRuntime
): boolean {
	if (pluginRuntime === 'universal') {
		return true;
	}

	return runtime === pluginRuntime;
}
