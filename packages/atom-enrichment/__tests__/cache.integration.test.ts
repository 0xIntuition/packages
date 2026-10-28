import { describe, expect, it } from 'bun:test';
import {
	buildCacheKey,
	type CacheAdapter,
	type CachedEntry,
	createMemoryCacheAdapter,
	createUpstashCacheAdapterFromEnv,
} from '../src/cache';
import { createEnrichmentEngine } from '../src/engine';
import { createWikipediaPlugin } from '../src/plugins/providers/wikipedia';
import { createMockRequest } from '../src/testing';

describe('cache adapter and engine cache integration', () => {
	it('buildCacheKey is deterministic for equivalent inputs', () => {
		const left = buildCacheKey('opengraph', {
			atomType: 'company',
			hints: {
				name: 'Acme Labs',
				url: 'HTTPS://acme.example/',
				identifiers: {
					wikidata: 'Q123',
					github: 'acme',
				},
			},
		});

		const right = buildCacheKey('opengraph', {
			atomType: 'company',
			hints: {
				name: ' acme labs ',
				url: 'https://acme.example',
				identifiers: {
					github: 'acme',
					wikidata: 'Q123',
				},
			},
		});

		expect(left).toBe(right);
	});

	it('buildCacheKey changes for materially different inputs', () => {
		const left = buildCacheKey('opengraph', {
			atomType: 'company',
			hints: { name: 'Acme Labs', url: 'https://acme.example' },
		});
		const right = buildCacheKey('opengraph', {
			atomType: 'company',
			hints: { name: 'Other Labs', url: 'https://acme.example' },
		});

		expect(left).not.toBe(right);
	});

	it('buildCacheKey includes jsonLd payload differences', () => {
		const left = buildCacheKey('opengraph', {
			atomType: 'company',
			jsonLd: {
				'@type': 'Organization',
				name: 'Acme Labs',
				url: 'https://acme.example',
			},
		});
		const right = buildCacheKey('opengraph', {
			atomType: 'company',
			jsonLd: {
				'@type': 'Organization',
				name: 'Acme Labs',
				url: 'https://other.example',
			},
		});

		expect(left).not.toBe(right);
	});

	it('keys P0 and P2 profiles for the same canonical IID identically', () => {
		const p0 = buildCacheKey('spotify', {
			atomType: 'song',
			identifier: {
				iid: 'int:isrc:USUM71703861',
				scheme: 'isrc',
				value: 'USUM71703861',
			},
		});
		const p2 = buildCacheKey('spotify', {
			atomType: 'song',
			jsonLd: {
				'@type': 'MusicRecording',
				identifier: 'int:isrc:us-um7-17-03861',
				name: 'Fixture Song',
				byArtist: 'Fixture Artist',
			},
		});

		expect(p0).toBe(p2);
		expect(p0).toContain('iid:int%3Aisrc%3AUSUM71703861');
	});

	it('never aliases two different canonical IIDs', () => {
		const left = buildCacheKey('spotify', {
			atomType: 'song',
			jsonLd: { identifier: 'int:isrc:USUM71703861' },
		});
		const right = buildCacheKey('spotify', {
			atomType: 'song',
			jsonLd: { identifier: 'int:isrc:GBAYE0601498' },
		});

		expect(left).not.toBe(right);
	});

	it('serves a rich P2 request from a bare P0 IID cache entry', async () => {
		const cache = createMemoryCacheAdapter();
		let calls = 0;
		const engine = createEnrichmentEngine({
			cache,
			plugins: [
				{
					id: 'iid-cache-fixture',
					version: '1.0.0',
					runtime: 'universal',
					artifactTypes: ['opengraph'],
					TTL: 60,
					supports: () => true,
					enrich: async () => {
						calls += 1;
						return [];
					},
				},
			],
		});
		const source = {
			classificationEngine: 'iid-cache-fixture',
			classifiedAt: '2026-08-07T12:00:00.000Z',
		};

		const p0 = await engine.enrich({
			input: {
				atomType: 'song',
				identifier: {
					iid: 'int:isrc:USUM71703861',
					scheme: 'isrc',
					value: 'USUM71703861',
				},
				source,
			},
			runtime: 'server',
		});
		const p2 = await engine.enrich({
			input: {
				atomType: 'song',
				jsonLd: {
					'@type': 'MusicRecording',
					identifier: 'int:isrc:us-um7-17-03861',
					name: 'Fixture Song',
				},
				source,
			},
			runtime: 'server',
		});

		expect(calls).toBe(1);
		expect(p0.timings.cacheMisses).toBe(1);
		expect(p2.timings.cacheHits).toBe(1);
	});

	it('createUpstashCacheAdapterFromEnv returns undefined when env vars are absent', () => {
		const cache = createUpstashCacheAdapterFromEnv({
			env: {},
		});

		expect(cache).toBeUndefined();
	});

	it('MemoryCacheAdapter respects TTL expiration', async () => {
		let nowMs = 0;
		const cache = createMemoryCacheAdapter({ now: () => nowMs });

		await cache.set(
			'key',
			{
				artifacts: [],
				cachedAt: new Date(nowMs).toISOString(),
				ttlMs: 1_000,
			},
			1_000
		);

		nowMs = 500;
		expect(await cache.get('key')).not.toBeNull();

		nowMs = 1_500;
		expect(await cache.get('key')).toBeNull();
	});

	it('MemoryCacheAdapter evicts least recently used entries when maxEntries is reached', async () => {
		let nowMs = 0;
		const cache = createMemoryCacheAdapter({ maxEntries: 1, now: () => nowMs });

		const entry: CachedEntry = {
			artifacts: [],
			cachedAt: new Date(nowMs).toISOString(),
			ttlMs: 10_000,
		};

		await cache.set('first', entry, entry.ttlMs);
		nowMs += 1;
		await cache.set('second', entry, entry.ttlMs);

		expect(await cache.get('first')).toBeNull();
		expect(await cache.get('second')).not.toBeNull();
	});

	it('engine serves cached artifacts on repeated requests', async () => {
		const cache = createMemoryCacheAdapter();
		const engine = createEnrichmentEngine({ cache });
		let calls = 0;

		engine.registerPlugin({
			id: 'cached-opengraph',
			version: '1.0.0',
			runtime: 'universal',
			artifactTypes: ['opengraph'],
			TTL: 60,
			supports: () => true,
			enrich: async () => {
				calls += 1;
				return [
					{
						artifact_type: 'opengraph',
						data: {
							title: 'Acme Labs',
							url: 'https://acme.example',
						},
						meta: {
							pluginId: 'cached-opengraph',
							provider: 'test',
							fetchedAt: new Date().toISOString(),
						},
					},
				];
			},
		});

		const first = await engine.enrich(createMockRequest());
		const second = await engine.enrich(createMockRequest());

		expect(calls).toBe(1);
		expect(first.timings.cacheMisses).toBe(1);
		expect(first.timings.cacheHits).toBe(0);
		expect(second.timings.cacheHits).toBe(1);
		expect(second.artifacts[0]?.meta.fromCache).toBe(true);
		expect(second.artifacts[0]?.meta.cachedAt).toBeTruthy();
	});

	it('engine re-fetches when cache entry expires', async () => {
		let nowMs = 0;
		const cache = createMemoryCacheAdapter({ now: () => nowMs });
		const engine = createEnrichmentEngine({
			cache,
			now: () => new Date(nowMs).toISOString(),
		});
		let calls = 0;

		engine.registerPlugin({
			id: 'expiring-opengraph',
			version: '1.0.0',
			runtime: 'universal',
			artifactTypes: ['opengraph'],
			TTL: 1,
			supports: () => true,
			enrich: async () => {
				calls += 1;
				return [
					{
						artifact_type: 'opengraph',
						data: {
							title: 'Acme Labs',
							url: 'https://acme.example',
						},
						meta: {
							pluginId: 'expiring-opengraph',
							provider: 'test',
							fetchedAt: new Date(nowMs).toISOString(),
						},
					},
				];
			},
		});

		await engine.enrich(createMockRequest());
		nowMs = 2_000;
		const second = await engine.enrich(createMockRequest());

		expect(calls).toBe(2);
		expect(second.timings.cacheMisses).toBe(1);
		expect(second.timings.cacheHits).toBe(0);
	});

	it('cache adapter failures are non-fatal', async () => {
		const brokenCache: CacheAdapter = {
			get: async () => {
				throw new Error('cache unavailable');
			},
			set: async () => {
				throw new Error('cache unavailable');
			},
			delete: async () => {},
		};

		const engine = createEnrichmentEngine({ cache: brokenCache });

		engine.registerPlugin({
			id: 'nonfatal-cache-plugin',
			version: '1.0.0',
			runtime: 'universal',
			artifactTypes: ['opengraph'],
			TTL: 1,
			supports: () => true,
			enrich: async () => [
				{
					artifact_type: 'opengraph',
					data: {
						title: 'Acme Labs',
						url: 'https://acme.example',
					},
					meta: {
						pluginId: 'nonfatal-cache-plugin',
						provider: 'test',
						fetchedAt: new Date().toISOString(),
					},
				},
			],
		});

		const result = await engine.enrich(createMockRequest());

		expect(result.status).toBe('success');
		expect(result.artifacts).toHaveLength(1);
	});
});

it('plugin versions separate both iid and fallback cache keys', () => {
	for (const input of [
		{ atomType: 'thing', hints: { name: 'Suspiria' } },
		{ atomType: 'thing', identifier: { iid: 'int:wd:Q546900' } },
	]) {
		const oldKey = buildCacheKey('wikipedia', input, '1.0.0');
		const plugin = createWikipediaPlugin();
		const key = buildCacheKey(plugin.id, input, plugin.version);
		expect(buildCacheKey(plugin.id, input, '1.1.0')).not.toBe(oldKey);
		expect(plugin.version).toBe('1.1.0');
		expect(key).not.toBe(oldKey);
		expect(key).toContain(`:v:${plugin.version}:`);
		expect(key.replace(`:v:${plugin.version}:`, ':')).toBe(buildCacheKey(plugin.id, input));
	}
});
