import { expect, test } from 'bun:test';
import { createEnrichmentEngine } from '../src/engine';
import type { EnrichmentIdentityCapability, EnrichmentPluginContext } from '../src/plugins';
import { createMockPlugin, createMockRequest } from '../src/testing';

test('identity is injected per engine and the absent context keeps its original shape', async () => {
	const identity: EnrichmentIdentityCapability = {
		fingerprint: 'test-policy@1',
		resolveWikidataSchemaType: () => 'Movie',
	};
	const contexts: EnrichmentPluginContext[] = [];
	const plugin = createMockPlugin({
		enrich: async (_request, ctx) => {
			contexts.push(ctx);
			return [];
		},
	});
	const configured = createEnrichmentEngine({ plugins: [plugin], identity });
	const absent = createEnrichmentEngine({ plugins: [plugin] });
	await configured.enrich(createMockRequest());
	await absent.enrich(createMockRequest());
	await configured.enrich(createMockRequest());
	expect(contexts).toHaveLength(3);
	expect(contexts[0]?.identity).toBe(identity);
	expect(contexts[1]?.identity).toBeUndefined();
	expect(Object.hasOwn(contexts[1] ?? {}, 'identity')).toBe(false);
	expect(contexts[2]?.identity).toBe(identity);
});

test('identity requires a non-blank fingerprint', () => {
	for (const fingerprint of ['', '   ']) {
		expect(() =>
			createEnrichmentEngine({
				identity: { fingerprint, resolveWikidataSchemaType: () => undefined },
			})
		).toThrow('EnrichmentEngineConfig.identity.fingerprint must be a non-empty string');
	}
});

test('cache identity policy separates unversioned plugins and keeps versioned keys stable', async () => {
	const { buildCacheKey, createMemoryCacheAdapter } = await import('../src/cache');
	const cache = createMemoryCacheAdapter();
	const request = createMockRequest();
	const keys: string[] = [];
	const recordedCache = {
		...cache,
		get: async (key: string) => {
			keys.push(key);
			return cache.get(key);
		},
	};
	const plugin = createMockPlugin({ version: undefined, TTL: 60 });
	for (const fingerprint of ['policy-a@1', 'policy-b@1']) {
		await createEnrichmentEngine({
			cache: recordedCache,
			plugins: [plugin],
			identity: { fingerprint, resolveWikidataSchemaType: () => undefined },
		}).enrich(request);
	}
	expect(keys).toEqual(
		['policy-a@1', 'policy-b@1'].map((identity) =>
			buildCacheKey(plugin.id, request.input, { identity })
		)
	);
	expect(keys[0]).not.toBe(keys[1]);
	plugin.version = '2.0.0';
	await createEnrichmentEngine({
		cache: recordedCache,
		plugins: [plugin],
		identity: { fingerprint: 'policy-a@1', resolveWikidataSchemaType: () => undefined },
	}).enrich(request);
	expect(keys[2]).toBe(buildCacheKey(plugin.id, request.input, '2.0.0'));
});

test('policy objects preserve canonical IID keys and distinguish absent-policy fingerprints', async () => {
	const { buildCacheKey, NO_IDENTITY_POLICY_MARKER } = await import('../src/cache');
	const input = createMockRequest().input;
	expect(buildCacheKey('mock-plugin', input, {})).toBe(
		buildCacheKey('mock-plugin', input, { identity: NO_IDENTITY_POLICY_MARKER })
	);
	expect(buildCacheKey('mock-plugin', input, {})).not.toBe(buildCacheKey('mock-plugin', input));
	const canonical = { ...input, identifier: { iid: 'int:isbn:9780140328721' } };
	expect(buildCacheKey('mock-plugin', canonical, { identity: 'policy/a@1' })).toBe(
		`${buildCacheKey('mock-plugin', canonical)}:policy:policy%2Fa%401`
	);
	expect(buildCacheKey('mock-plugin', canonical, {})).toBe(buildCacheKey('mock-plugin', canonical));
});
