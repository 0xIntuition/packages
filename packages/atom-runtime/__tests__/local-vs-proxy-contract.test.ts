import { describe, expect, it } from 'bun:test';

import { createAtomServicesProcessingRuntime, createTrpcLocalProcessingRuntime } from '../src';

describe('tRPC-local and atom-services composition contract', () => {
	it('shares plugins and presets while fingerprinting named surface differences', () => {
		const env = {
			ATOM_SERVICES_CACHE_PROVIDER: 'memory',
			ATOM_SERVICES_DEFAULT_PRESET: 'default',
			ATOM_SERVICES_MEMORY_CACHE_MAX_ENTRIES: '500',
			ATOM_SERVICES_CLASSIFICATION_MEMORY_CACHE_MAX_ENTRIES: '500',
			ATOM_SERVICES_CLASSIFICATION_RESOLVER_CACHE_TTL_MS: '300000',
			ATOM_SERVICES_CACHE_HTTP_TIMEOUT_MS: '1500',
			CANOPY_API_KEY: 'canopy-fixture',
			SPOTIFY_CLIENT_ID: 'spotify-fixture',
			SPOTIFY_CLIENT_SECRET: 'spotify-secret-fixture',
		};
		const local = createTrpcLocalProcessingRuntime(env, {
			classification: { onClassifierError: () => undefined },
		});
		const proxy = createAtomServicesProcessingRuntime({
			env,
			onClassifierError: () => undefined,
		});

		expect(local.fingerprint).not.toBe(proxy.fingerprint);
		expect(local.enrichment.presetSummary).toEqual(proxy.enrichment.presetSummary);
		expect(local.classification.pluginIds).toEqual(proxy.classification.pluginIds);
		expect(local.config).toMatchObject({
			cacheProviderResolution: 'auto-from-credentials',
			upstashCredentialFallback: 'none',
			classificationCache: 'disabled',
		});
		expect(proxy.config).toMatchObject({
			cacheProviderResolution: 'explicit',
			upstashCredentialFallback: 'memory',
			classificationCache: 'enabled',
		});
	});
});
