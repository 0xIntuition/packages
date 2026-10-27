import { describe, expect, it } from 'bun:test';
import {
	BASE_DEFAULT_PROCESSING_FINGERPRINT,
	computeProcessingConfigFingerprint,
	createProcessingRuntime,
	pickProcessingEnv,
} from '../src';

describe('public Promise runtime', () => {
	it('defaults the optional observer and preserves the pinned fingerprint', () => {
		const input = { env: {}, cache: { provider: 'none' as const } };
		const runtime = createProcessingRuntime(input);
		expect(runtime.fingerprint).toBe(BASE_DEFAULT_PROCESSING_FINGERPRINT);
		expect(computeProcessingConfigFingerprint(input)).toBe(runtime.fingerprint);
		expect(runtime.classification.engine()).toBe(runtime.classification.engine());
		expect(runtime.enrichment.engine('default')).toBe(runtime.enrichment.engine('default'));
		expect(runtime.enrichment.engine('company')).not.toBe(runtime.enrichment.engine('default'));
		expect(runtime.cache.classification).toBe(runtime.caches.classification);
		runtime.dispose();
		expect(() => runtime.classification.engine()).toThrow('disposed');
	});
	it('filters unrelated environment keys before composing factories', () => {
		const env = { UNRELATED_SECRET: 'private', SPOTIFY_MARKET: 'US', TMDB_API_KEY: 'test' };
		expect(pickProcessingEnv(env)).toEqual({ SPOTIFY_MARKET: 'US', TMDB_API_KEY: 'test' });
		expect(createProcessingRuntime({ env }).config.env).not.toHaveProperty('UNRELATED_SECRET');
	});
});

it('keeps provider slugs and the reference preset inventory aligned', async () => {
	const { PROVIDER_SLUGS } = await import('@0xintuition/iid-registry');
	const { defaultScopes } = await import('../src/presets');
	const fixture = (await import('./fixtures/preset-parity.json')).default;
	const runtime = createProcessingRuntime({ env: {} });
	expect(runtime.classification.pluginIds).toEqual(fixture.classification);
	expect(
		Object.fromEntries(
			Object.entries(runtime.enrichment.presetFactories).map(([key, factory]) => [
				key,
				factory().map((plugin) => ({ id: plugin.id, ttl: plugin.TTL })),
			])
		)
	).toEqual(fixture.enrichment);
	for (const scope of Object.values(defaultScopes))
		for (const provider of scope.providers ?? []) expect(PROVIDER_SLUGS).toContain(provider);
});

it('supports composition options and separates identity capabilities', () => {
	const runtime = createProcessingRuntime({
		config: { env: {} },
		overrides: { classification: [], enrichment: { default: [] } },
	});
	const identity = { fingerprint: 'test@1', resolveWikidataSchemaType: () => undefined };
	expect(runtime.classification.pluginIds).toEqual([]);
	expect(runtime.enrichment.engine('default', identity)).toBe(
		runtime.enrichment.engine('default', identity)
	);
	expect(runtime.enrichment.engine('default', identity)).not.toBe(
		runtime.enrichment.engine('default')
	);
});
