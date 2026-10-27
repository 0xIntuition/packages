import {
	emitProviderEvent,
	type ProviderRequestEvent,
} from '@0xintuition/pipeline-runtime/provider-observer';
import { lookupProviderOperation } from '@0xintuition/pipeline-runtime/provider-registry';
import type { EnrichmentPlugin } from './plugins';
import type { EnrichmentRequest } from './types';

/**
 * Reports an artifact-cache hit for an observed plugin (ENG-16976): the cache
 * served the run, so the provider was not dialled. One `source=cache` event per
 * operation the plugin declares as cacheable for this request. Hit or miss is decided
 * from the cached artifacts as they were stored, BEFORE normalization re-validates them:
 * an entry whose artifacts a newer schema now rejects was still served as a hit by the
 * live run that wrote it. A cached empty result is a `miss`, where the registry declares one. Observation only: it
 * never throws and never changes the cached result.
 */
export function observeArtifactCacheHit(
	plugin: EnrichmentPlugin,
	request: EnrichmentRequest,
	cachedArtifactCount: number
): void {
	const { observability } = plugin;
	if (!observability) return;
	try {
		const outcome = cachedArtifactCount > 0 ? 'hit' : 'miss';
		for (const operation of observability.cacheOperations(request)) {
			// Only series the registry declares: an operation without a cache source, or an
			// outcome the operation cannot have (OpenLibrary never caches an empty result),
			// is not a metric.
			const spec = lookupProviderOperation(observability.provider, operation);
			if (!spec?.cacheOutcomes.includes(outcome)) continue;
			emitProviderEvent({
				type: 'provider_request',
				provider: observability.provider,
				operation,
				outcome,
				reason: 'none',
				source: 'cache',
			} as ProviderRequestEvent);
		}
	} catch {
		// Observability must never alter the observed path.
	}
}
