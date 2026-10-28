import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import {
	addProviderObserver,
	type ProviderEvent,
	type ProviderRequestEvent,
	resetProviderObserversForTests,
} from '@0xintuition/pipeline-runtime/provider-observer';
import { lookupProviderOperation } from '@0xintuition/pipeline-runtime/provider-registry';
import { createMemoryCacheAdapter } from '../src/cache';
import { createEnrichmentEngine } from '../src/engine';
import type { EnrichmentPlugin, EnrichmentPluginObservability } from '../src/plugins';
import { createOpenLibraryPlugin } from '../src/plugins/providers/openlibrary';
import { createMockAtomInput, createMockRequest } from '../src/testing';

let events: ProviderEvent[];
const cacheEvents = () =>
	events.filter(
		(event): event is ProviderRequestEvent =>
			event.type === 'provider_request' && event.source === 'cache'
	);

beforeEach(() => {
	events = [];
	resetProviderObserversForTests();
	addProviderObserver((event) => {
		events.push(event);
	});
});
afterEach(() => resetProviderObserversForTests());

function fixturePlugin(
	artifacts: number,
	observability?: EnrichmentPluginObservability
): { plugin: EnrichmentPlugin; calls: () => number } {
	let calls = 0;
	return {
		calls: () => calls,
		plugin: {
			id: 'openlibrary',
			version: '1.0.0',
			runtime: 'universal',
			artifactTypes: ['opengraph'],
			TTL: 60,
			...(observability ? { observability } : {}),
			supports: () => true,
			enrich: async (_request, ctx) => {
				calls += 1;
				return Array.from({ length: artifacts }, () => ({
					artifact_type: 'opengraph' as const,
					data: { title: 'Fixture' },
					meta: { fetchedAt: ctx.now(), pluginId: 'openlibrary', provider: 'openlibrary' },
				}));
			},
		},
	};
}

async function runTwice(plugin: EnrichmentPlugin) {
	const engine = createEnrichmentEngine({
		cache: createMemoryCacheAdapter(),
		plugins: [plugin],
		now: () => '2040-01-01T00:00:00.000Z',
	});
	const request = createMockRequest({ input: createMockAtomInput({}) });
	await engine.enrich(request);
	const afterLive = cacheEvents().length;
	const second = await engine.enrich(request);
	return { afterLive, second };
}

describe('engine artifact-cache hits (ENG-16976)', () => {
	it('emits one source=cache hit per declared operation when the cache serves artifacts', async () => {
		const { plugin, calls } = fixturePlugin(1, {
			provider: 'openlibrary',
			cacheOperations: () => ['work', 'isbn'],
		});
		const { afterLive, second } = await runTwice(plugin);

		expect(calls()).toBe(1);
		expect(second.timings.cacheHits).toBe(1);
		// The live run (a cache miss) is the plugin's to report, never the engine's.
		expect(afterLive).toBe(0);
		expect(cacheEvents()).toEqual([
			{
				type: 'provider_request',
				provider: 'openlibrary',
				operation: 'work',
				outcome: 'hit',
				reason: 'none',
				source: 'cache',
			},
			{
				type: 'provider_request',
				provider: 'openlibrary',
				operation: 'isbn',
				outcome: 'hit',
				reason: 'none',
				source: 'cache',
			},
		]);
	});

	it('reports a cached empty result as a cache miss where the registry declares one', async () => {
		const { plugin } = fixturePlugin(0, {
			provider: 'openlibrary',
			cacheOperations: () => ['search_title'],
		});
		await runTwice(plugin);
		expect(cacheEvents().map(({ operation, outcome }) => ({ operation, outcome }))).toEqual([
			{ operation: 'search_title', outcome: 'miss' },
		]);
	});

	it('emits nothing for a plugin that declares no observability', async () => {
		const { plugin } = fixturePlugin(1);
		const { second } = await runTwice(plugin);
		expect(second.timings.cacheHits).toBe(1);
		expect(cacheEvents()).toEqual([]);
	});

	it('never lets a throwing declaration alter the cached result', async () => {
		const { plugin } = fixturePlugin(1, {
			provider: 'openlibrary',
			cacheOperations: () => {
				throw new Error('boom');
			},
		});
		const { second } = await runTwice(plugin);
		expect(second.status).toBe('success');
		expect(second.artifacts).toHaveLength(1);
		expect(cacheEvents()).toEqual([]);
	});

	it('OpenLibrary declares the entity fetch its target selects, and nothing for an author', () => {
		const declared = (url: string) =>
			createOpenLibraryPlugin().observability?.cacheOperations(
				createMockRequest({
					input: createMockAtomInput({
						hints: { url },
						jsonLd: { '@context': 'https://schema.org', '@type': 'Book', name: 'B', url },
					}),
				})
			);
		expect(declared('https://openlibrary.org/works/OL45804W')).toEqual(['work']);
		expect(declared('https://openlibrary.org/books/OL7353617M')).toEqual(['book']);
		expect(declared('https://openlibrary.org/isbn/9780140328721')).toEqual(['isbn']);
		expect(declared('https://openlibrary.org/authors/OL23919A')).toEqual([]);
		expect(declared('https://example.com/')).toEqual([]);
		// Every declared operation has a cache source in the registry.
		for (const url of [
			'https://openlibrary.org/works/OL45804W',
			'https://openlibrary.org/books/OL7353617M',
			'https://openlibrary.org/isbn/9780140328721',
		]) {
			for (const operation of declared(url) ?? []) {
				expect(lookupProviderOperation('openlibrary', operation)?.cacheOutcomes).toContain('hit');
			}
		}
	});

	it('decides hit or miss from the cached artifacts BEFORE normalization re-validates them', async () => {
		// An entry whose artifact a validator now rejects was still served as a hit by the live run
		// that wrote it; counting what survives re-validation would report a miss.
		const { plugin } = fixturePlugin(1, {
			provider: 'openlibrary',
			cacheOperations: () => ['work'],
		});
		const cache = createMemoryCacheAdapter();
		const engine = createEnrichmentEngine({
			cache,
			plugins: [plugin],
			now: () => '2040-01-01T00:00:00.000Z',
		});
		const request = createMockRequest({ input: createMockAtomInput({}) });
		await engine.enrich(request);
		// Corrupt the stored artifact so normalization drops it on the way out.
		const key = (await import('../src/cache')).buildCacheKey(
			plugin.id,
			request.input,
			plugin.version
		);
		const stored = await cache.get(key);
		expect(stored?.artifacts).toHaveLength(1);
		await cache.set(
			key,
			{
				...stored!,
				artifacts: stored!.artifacts.map((artifact) => ({
					...artifact,
					artifact_type: 'not_a_registered_type' as typeof artifact.artifact_type,
				})),
			},
			60_000
		);
		const second = await engine.enrich(request);
		expect(second.artifacts).toHaveLength(0);
		expect(cacheEvents().map(({ operation, outcome }) => ({ operation, outcome }))).toEqual([
			{ operation: 'work', outcome: 'hit' },
		]);
	});

	it('emits nothing for an operation or outcome the registry does not declare for the cache', async () => {
		// `editions` has no cache source at all; OpenLibrary never caches an empty `work`.
		const noSource = fixturePlugin(1, {
			provider: 'openlibrary',
			cacheOperations: () => ['editions', 'author', 'work'],
		});
		await runTwice(noSource.plugin);
		expect(cacheEvents().map(({ operation }) => operation)).toEqual(['work']);
		events = [];
		const emptyWork = fixturePlugin(0, {
			provider: 'openlibrary',
			cacheOperations: () => ['work', 'search_title'],
		});
		await runTwice(emptyWork.plugin);
		// work: a cached empty result is a miss, which OpenLibrary's work does not declare.
		// search_title declares miss for the cache.
		expect(cacheEvents().map(({ operation, outcome }) => ({ operation, outcome }))).toEqual([
			{ operation: 'search_title', outcome: 'miss' },
		]);
	});

	it('the compiler rejects an operation of another provider in a declaration', () => {
		// @ts-expect-error `work` is an OpenLibrary operation, not a Goodreads one
		const declaration: EnrichmentPluginObservability = {
			provider: 'goodreads',
			cacheOperations: () => ['work'],
		};
		expect(declaration.provider).toBe('goodreads');
	});
});
