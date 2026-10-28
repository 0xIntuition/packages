import { describe, expect, it } from 'bun:test';
import {
	buildClassificationResolverCacheKey,
	type ClassificationCacheAdapter,
	type ClassificationResolverCachedEntry,
	createMemoryClassificationCacheAdapter,
	createUpstashClassificationCacheAdapter,
} from '../src/cache';
import { createClassificationEngine } from '../src/engine';
import type { AtomClassificationPlugin } from '../src/plugins';
import { classificationResultSchema } from '../src/types';

describe('classification cache adapter and engine cache integration', () => {
	it('buildClassificationResolverCacheKey is deterministic for equivalent inputs', () => {
		const left = buildClassificationResolverCacheKey({
			pluginId: 'platform-v0',
			resolverId: 'platform-resolver',
			runtime: 'server',
			request: {
				input: ' https://example.com/company/acme ',
				mode: 'progressive',
				inputIntent: 'generic',
				pluginIds: ['open-graph', 'brand-api'],
				policy: undefined,
				clientHints: undefined,
			},
			classification: {
				type: 'url',
				domain: 'example',
				subtype: 'company',
				confidence: 0.95,
				meta: { source: 'unit-test' },
			},
		});

		const right = buildClassificationResolverCacheKey({
			pluginId: 'platform-v0',
			resolverId: 'platform-resolver',
			runtime: 'server',
			request: {
				input: 'https://example.com/company/acme',
				mode: 'progressive',
				inputIntent: 'generic',
				pluginIds: ['brand-api', 'open-graph'],
				policy: undefined,
				clientHints: undefined,
			},
			classification: {
				type: 'url',
				domain: 'example',
				subtype: 'company',
				confidence: 0.95,
				meta: { source: 'unit-test' },
			},
		});

		expect(left).toBe(right);
	});

	it('buildClassificationResolverCacheKey changes for different plugin ids', () => {
		const baseInput = {
			resolverId: 'platform-resolver',
			runtime: 'server' as const,
			request: {
				input: 'https://example.com/company/acme',
				mode: 'progressive' as const,
				inputIntent: 'generic' as const,
				pluginIds: ['brand-api', 'open-graph'],
				policy: undefined,
				clientHints: undefined,
			},
			classification: {
				type: 'url' as const,
				domain: 'example',
				subtype: 'company',
				confidence: 0.95,
				meta: {},
			},
		};

		const left = buildClassificationResolverCacheKey({
			...baseInput,
			pluginId: 'platform-v0',
		});
		const right = buildClassificationResolverCacheKey({
			...baseInput,
			pluginId: 'non-url-v0',
		});

		expect(left).not.toBe(right);
	});

	it('engine reuses cached resolver output across classification sessions', async () => {
		const cache = createMemoryClassificationCacheAdapter();
		let resolverCalls = 0;
		const engine = createClassificationEngine({
			onClassifierError: () => undefined,
			runtime: 'server',
			cache,
			plugins: [createCacheTestPlugin(() => ++resolverCalls, 60)],
		});

		const first = await engine.classify({
			input: 'https://example.com/company/acme',
			mode: 'progressive',
			classificationSessionId: 'session-a',
		});
		const second = await engine.classify({
			input: 'https://example.com/company/acme',
			mode: 'progressive',
			classificationSessionId: 'session-b',
		});

		expect(first.status).toBe('complete');
		expect(second.status).toBe('complete');
		expect(resolverCalls).toBe(1);
		expect(first.resolved?.atoms[0]?.title).toBe('Acme Corp #1');
		expect(second.resolved?.atoms[0]?.title).toBe('Acme Corp #1');
	});

	it('loads an old-format resolver cache entry without diagnostics', async () => {
		const cacheState: { entry?: ClassificationResolverCachedEntry } = {};
		let resolverCalls = 0;
		const cache: ClassificationCacheAdapter = {
			get: async () => cacheState.entry ?? null,
			set: async (_key, entry) => {
				cacheState.entry = entry;
			},
			delete: async () => {
				delete cacheState.entry;
			},
		};
		const engine = createClassificationEngine({
			onClassifierError: () => undefined,
			runtime: 'server',
			cache,
			plugins: [createCacheTestPlugin(() => ++resolverCalls, 60)],
		});

		await engine.classify({
			input: 'https://example.com/company/acme',
			mode: 'progressive',
			classificationSessionId: 'old-cache-write',
		});
		const populatedEntry = cacheState.entry;
		if (!populatedEntry) {
			throw new Error('Expected the first classification to populate the resolver cache');
		}
		const { errors: _removedDiagnosticField, ...oldFormatEntry } = populatedEntry;
		cacheState.entry = oldFormatEntry;

		const second = await engine.classify({
			input: 'https://example.com/company/acme',
			mode: 'progressive',
			classificationSessionId: 'old-cache-read',
		});

		expect(second.status).toBe('complete');
		expect(second.resolved?.atoms[0]?.title).toBe('Acme Corp #1');
		expect(second.resolverErrors ?? []).toEqual([]);
		expect(resolverCalls).toBe(1);
	});

	it('normalizes poisoned diagnostics from the memory cache without losing the atom', async () => {
		const memoryCache = createMemoryClassificationCacheAdapter();
		let populatedKey: string | undefined;
		const cache: ClassificationCacheAdapter = {
			get: async (key) => {
				populatedKey = key;
				return memoryCache.get(key);
			},
			set: async (key, entry, ttlMs) => memoryCache.set(key, entry, ttlMs),
			delete: async (key) => memoryCache.delete(key),
		};
		let resolverCalls = 0;
		const engine = createClassificationEngine({
			onClassifierError: () => undefined,
			runtime: 'server',
			cache,
			plugins: [createCacheTestPlugin(() => ++resolverCalls, 60)],
		});

		await engine.classify({
			input: 'https://example.com/company/acme',
			mode: 'progressive',
			classificationSessionId: 'poisoned-memory-write',
		});
		if (!populatedKey) {
			throw new Error('Expected the first classification to resolve a cache key');
		}
		const populatedEntry = await memoryCache.get(populatedKey);
		if (!populatedEntry) {
			throw new Error('Expected the first classification to populate the memory cache');
		}
		populatedEntry.errors = [
			{
				resolverId: 'cache-test-resolver',
				message: 'x'.repeat(513),
				timestamp: '2026-08-23T12:00:00.000Z',
			},
			{
				resolverId: '',
				message: 'invalid diagnostic',
				timestamp: 'not-a-timestamp',
			},
		];
		await memoryCache.set(populatedKey, populatedEntry, populatedEntry.ttlMs);

		const result = await engine.classify({
			input: 'https://example.com/company/acme',
			mode: 'progressive',
			classificationSessionId: 'poisoned-memory-read',
		});

		expect(resolverCalls).toBe(1);
		expect(result.status).toBe('complete');
		expect(result.resolved?.atoms[0]?.title).toBe('Acme Corp #1');
		expect(result.resolverErrors).toHaveLength(1);
		expect(result.resolverErrors?.[0]?.message).toHaveLength(512);
		expect(result.resolverErrors?.[0]?.message.endsWith('…')).toBe(true);
	});

	it('normalizes a poisoned Upstash-shaped cache hit without fetching the resolver', async () => {
		let cacheFetchCalls = 0;
		let resolverCalls = 0;
		const entry: ClassificationResolverCachedEntry = {
			atoms: [
				{
					schemaType: 'Organization',
					category: 'company',
					title: 'Acme Corp from Upstash',
					description: 'Cached resolver output',
					canonicalId: 'https://example.com/company/acme',
					sameAs: ['https://example.com/company/acme'],
					source: 'cache-test-resolver',
					confidence: 0.95,
					data: { callNumber: 0 },
					hints: {},
					metadata: {},
				},
			],
			fallbackUsed: false,
			errors: [
				{
					resolverId: 'cache-test-resolver',
					message: 'x'.repeat(513),
					timestamp: '2026-08-23T12:00:00.000Z',
				},
			],
			cachedAt: new Date().toISOString(),
			ttlMs: 60_000,
		};
		const cache = createUpstashClassificationCacheAdapter({
			baseUrl: 'https://cache.example.test',
			token: 'test-token',
			fetcher: (async () => {
				cacheFetchCalls += 1;
				return Response.json({ result: JSON.stringify(entry) });
			}) as unknown as typeof fetch,
		});
		const engine = createClassificationEngine({
			onClassifierError: () => undefined,
			runtime: 'server',
			cache,
			plugins: [createCacheTestPlugin(() => ++resolverCalls, 60)],
		});

		const result = await engine.classify({
			input: 'https://example.com/company/acme',
			mode: 'progressive',
			classificationSessionId: 'poisoned-upstash-read',
		});

		expect(cacheFetchCalls).toBe(1);
		expect(resolverCalls).toBe(0);
		expect(result.status).toBe('complete');
		expect(result.resolved?.atoms[0]?.title).toBe('Acme Corp from Upstash');
		expect(result.resolverErrors).toHaveLength(1);
		expect(result.resolverErrors?.[0]?.message).toHaveLength(512);
		expect(result.resolverErrors?.[0]?.message.endsWith('…')).toBe(true);
	});

	it('bounds poisoned cached diagnostics before normalization work', async () => {
		const errors = Array.from({ length: 10 }, (_, index) => ({
			resolverId: `cache-poison-${index}`,
			message: 'x'.repeat(2_048),
			timestamp: '2026-08-23T12:00:00.000Z',
		}));
		errors.length = 25_000;
		Object.defineProperty(errors, 10, {
			get: () => {
				throw new Error('normalization read past the diagnostic cap');
			},
		});
		const entry: ClassificationResolverCachedEntry = {
			atoms: [
				{
					schemaType: 'Organization',
					category: 'company',
					title: 'Cached Atom Must Survive',
					canonicalId: 'https://example.com/company/acme',
					sameAs: ['https://example.com/company/acme'],
					source: 'cache-test-resolver',
					confidence: 0.95,
					data: {},
					hints: {},
					metadata: {},
				},
			],
			fallbackUsed: false,
			errors,
			cachedAt: new Date().toISOString(),
			ttlMs: 60_000,
		};
		let resolverCalls = 0;
		const engine = createClassificationEngine({
			onClassifierError: () => undefined,
			runtime: 'server',
			cache: {
				get: async () => entry,
				set: async () => undefined,
				delete: async () => undefined,
			},
			plugins: [createCacheTestPlugin(() => ++resolverCalls, 60)],
		});

		const result = await engine.classify({
			input: 'https://example.com/company/acme',
			mode: 'progressive',
			classificationSessionId: 'poisoned-cache-count-bound',
		});

		expect(resolverCalls).toBe(0);
		expect(result.status).toBe('complete');
		expect(result.resolved?.atoms[0]?.title).toBe('Cached Atom Must Survive');
		expect(result.resolverErrors).toHaveLength(10);
	});

	it('caps live resolver diagnostics and rejects an over-cap public result', async () => {
		const engine = createClassificationEngine({
			onClassifierError: () => undefined,
			runtime: 'server',
			plugins: [createDiagnosticCapTestPlugin()],
		});

		const result = await engine.classify({
			input: 'https://example.com/company/acme',
			mode: 'progressive',
			classificationSessionId: 'live-diagnostic-count-bound',
		});

		expect(result.status).toBe('complete');
		expect(result.resolved?.atoms[0]?.title).toBe('Live Atom Must Survive');
		expect(result.resolverErrors).toHaveLength(10);
		const overflow = classificationResultSchema.safeParse({
			...result,
			resolverErrors: Array.from({ length: 11 }, (_, index) => ({
				resolverId: `overflow-${index}`,
				message: 'bounded diagnostic',
				timestamp: '2026-08-23T12:00:00.000Z',
			})),
		});
		expect(overflow.success).toBe(false);
	});

	it('engine re-fetches resolver output when cache entry expires', async () => {
		let nowMs = 0;
		const cache = createMemoryClassificationCacheAdapter({ now: () => nowMs });
		let resolverCalls = 0;
		const engine = createClassificationEngine({
			onClassifierError: () => undefined,
			runtime: 'server',
			now: () => new Date(nowMs),
			cache,
			plugins: [createCacheTestPlugin(() => ++resolverCalls, 1)],
		});

		await engine.classify({
			input: 'https://example.com/company/acme',
			mode: 'progressive',
			classificationSessionId: 'session-exp-1',
		});

		nowMs = 2_000;
		const second = await engine.classify({
			input: 'https://example.com/company/acme',
			mode: 'progressive',
			classificationSessionId: 'session-exp-2',
		});

		expect(second.status).toBe('complete');
		expect(resolverCalls).toBe(2);
		expect(second.resolved?.atoms[0]?.title).toBe('Acme Corp #2');
	});

	it('cache adapter failures are non-fatal for classification', async () => {
		let resolverCalls = 0;
		const brokenCache: ClassificationCacheAdapter = {
			get: async () => {
				throw new Error('cache unavailable');
			},
			set: async () => {
				throw new Error('cache unavailable');
			},
			delete: async () => {
				throw new Error('cache unavailable');
			},
		};
		const engine = createClassificationEngine({
			onClassifierError: () => undefined,
			runtime: 'server',
			cache: brokenCache,
			plugins: [createCacheTestPlugin(() => ++resolverCalls, 60)],
		});

		const result = await engine.classify({
			input: 'https://example.com/company/acme',
			mode: 'progressive',
			classificationSessionId: 'session-broken-cache',
		});

		expect(result.status).toBe('complete');
		expect(result.resolved?.atoms).toHaveLength(1);
		expect(resolverCalls).toBe(1);
	});
});

function createCacheTestPlugin(
	nextResolverCall: () => number,
	cacheTtlSeconds: number
): AtomClassificationPlugin {
	return {
		manifest: {
			id: 'cache-test-plugin',
			version: '1.0.0',
			engineRange: '*',
			runtime: 'server',
			capabilities: [],
			permissions: [],
			dependsOn: [],
			provides: [],
			priority: 100,
		},
		classifiers: [
			{
				id: 'cache-test-classifier',
				classify: () => ({
					type: 'url',
					domain: 'example',
					subtype: 'company',
					confidence: 0.95,
					meta: {},
				}),
			},
		],
		resolvers: [
			{
				id: 'cache-test-resolver',
				executionMode: 'deterministic',
				cacheTtlSeconds,
				canResolve: () => true,
				resolve: () => {
					const callNumber = nextResolverCall();
					return {
						atoms: [
							{
								schemaType: 'Organization',
								category: 'company',
								title: `Acme Corp #${callNumber}`,
								description: 'Cache resolver output',
								canonicalId: 'https://example.com/company/acme',
								sameAs: ['https://example.com/company/acme'],
								source: 'cache-test-resolver',
								confidence: 0.95,
								data: {
									callNumber,
								},
							},
						],
						fallbackUsed: false,
						metadata: {
							callNumber,
						},
					};
				},
			},
		],
	};
}

function createDiagnosticCapTestPlugin(): AtomClassificationPlugin {
	return {
		manifest: {
			id: 'diagnostic-cap-test-plugin',
			version: '1.0.0',
			engineRange: '*',
			runtime: 'server',
			capabilities: [],
			permissions: [],
			dependsOn: [],
			provides: [],
			priority: 100,
		},
		classifiers: [
			{
				id: 'diagnostic-cap-test-classifier',
				classify: () => ({
					type: 'url',
					domain: 'example',
					subtype: 'company',
					confidence: 0.95,
					meta: {},
				}),
			},
		],
		resolvers: [
			...Array.from({ length: 11 }, (_, index) => ({
				id: `diagnostic-cap-failure-${index}`,
				executionMode: 'deterministic' as const,
				canResolve: () => true,
				resolve: () => {
					throw new Error(`diagnostic failure ${index}`);
				},
			})),
			{
				id: 'diagnostic-cap-success',
				executionMode: 'deterministic',
				canResolve: () => true,
				resolve: () => ({
					atoms: [
						{
							schemaType: 'Organization',
							category: 'company',
							title: 'Live Atom Must Survive',
							canonicalId: 'https://example.com/company/acme',
							sameAs: ['https://example.com/company/acme'],
							source: 'diagnostic-cap-success',
							confidence: 0.95,
							data: {},
						},
					],
					fallbackUsed: false,
				}),
			},
		],
	};
}
