import { describe, expect, it } from 'bun:test';

import {
	createAtomServicesProcessingRuntime,
	createTrpcLocalProcessingRuntime,
	type ProcessingRuntime,
} from '../src';

type Env = Record<string, string | undefined>;

const VALID_UPSTASH_ENV = {
	UPSTASH_REDIS_REST_URL: 'https://example.invalid',
	UPSTASH_REDIS_REST_TOKEN: 'redacted-test-token',
};

describe('surface-specific cache composition parity', () => {
	it('reproduces the tRPC-local HEAD matrix using only ENRICHMENT keys', async () => {
		const scenarios: Array<{
			name: string;
			env: Env;
			expected: 'memory' | 'none' | 'upstash';
		}> = [
			{ name: 'empty', env: {}, expected: 'memory' },
			{ name: 'credentials only', env: VALID_UPSTASH_ENV, expected: 'upstash' },
			{
				name: 'explicit Upstash',
				env: { ...VALID_UPSTASH_ENV, ENRICHMENT_CACHE_PROVIDER: 'upstash' },
				expected: 'upstash',
			},
			{
				name: 'Upstash missing credentials',
				env: { ENRICHMENT_CACHE_PROVIDER: 'upstash' },
				expected: 'none',
			},
			{
				name: 'conflicting provider namespaces',
				env: {
					...VALID_UPSTASH_ENV,
					ATOM_SERVICES_CACHE_PROVIDER: 'none',
					ENRICHMENT_CACHE_PROVIDER: 'upstash',
				},
				expected: 'upstash',
			},
			{
				name: 'explicit none',
				env: { ENRICHMENT_CACHE_PROVIDER: 'none' },
				expected: 'none',
			},
			{
				name: 'uppercase provider',
				env: { ...VALID_UPSTASH_ENV, ENRICHMENT_CACHE_PROVIDER: ' UPSTASH ' },
				expected: 'upstash',
			},
		];

		for (const scenario of scenarios) {
			const { kind, runtime } = await inspectRuntime(() =>
				createTrpcLocalProcessingRuntime(scenario.env, {
					classification: { onClassifierError: () => undefined },
				})
			);
			expect(kind, scenario.name).toBe(scenario.expected);
			expect(runtime.caches.classification, scenario.name).toBeUndefined();
			expect(runtime.config.cacheProviderResolution, scenario.name).toBe('auto-from-credentials');
			expect(runtime.config.upstashCredentialFallback, scenario.name).toBe('none');
			expect(runtime.config.classificationCache, scenario.name).toBe('disabled');
		}
	});

	it('keeps atom-services explicit-provider and fallback behavior', async () => {
		const memoryResult = await inspectRuntime(() =>
			createAtomServicesProcessingRuntime({
				env: {},
				cacheProvider: 'memory',
				onClassifierError: () => undefined,
			})
		);
		const noneResult = await inspectRuntime(() =>
			createAtomServicesProcessingRuntime({
				env: {},
				cacheProvider: 'none',
				onClassifierError: () => undefined,
			})
		);
		const upstashResult = await inspectRuntime(() =>
			createAtomServicesProcessingRuntime({
				env: VALID_UPSTASH_ENV,
				cacheProvider: 'upstash',
				onClassifierError: () => undefined,
			})
		);
		const fallbackResult = await inspectRuntime(() =>
			createAtomServicesProcessingRuntime({
				env: {},
				cacheProvider: 'upstash',
				onClassifierError: () => undefined,
			})
		);
		const memory = memoryResult.runtime;
		const upstash = upstashResult.runtime;
		const fallback = fallbackResult.runtime;

		expect(memoryResult.kind).toBe('memory');
		expect(noneResult.kind).toBe('none');
		expect(upstashResult.kind).toBe('upstash');
		expect(fallbackResult.kind).toBe('memory');
		expect(memory.caches.classification).toBeDefined();
		expect(upstash.caches.classification).toBeDefined();
		expect(memory.config.cacheProviderResolution).toBe('explicit');
		expect(memory.config.upstashCredentialFallback).toBe('memory');
		expect(memory.config.classificationCache).toBe('enabled');
		expect(fallback.warnings).toEqual([
			'ATOM_SERVICES_CACHE_PROVIDER=upstash requested, but UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are missing. Falling back to in-memory cache.',
		]);
	});

	it('enables the tRPC-local classification cache only through its explicit opt-in', () => {
		const disabled = createTrpcLocalProcessingRuntime(
			{},
			{ classification: { onClassifierError: () => undefined } }
		);
		const enabled = createTrpcLocalProcessingRuntime(
			{ CLASSIFICATION_CACHE_ENABLED: 'true' },
			{ classification: { onClassifierError: () => undefined } }
		);

		expect(disabled.caches.classification).toBeUndefined();
		expect(enabled.caches.classification).toBeDefined();
	});
});

async function inspectRuntime(
	createRuntime: () => ProcessingRuntime
): Promise<{ kind: 'memory' | 'none' | 'upstash'; runtime: ProcessingRuntime }> {
	const originalFetch = globalThis.fetch;
	let fetchCalls = 0;
	globalThis.fetch = (async () => {
		fetchCalls += 1;
		return new Response(JSON.stringify({ result: null }), { status: 200 });
	}) as unknown as typeof fetch;

	try {
		const runtime = createRuntime();
		const cache = runtime.caches.enrichment;
		if (!cache) {
			return { kind: 'none', runtime };
		}
		await cache.get('fix1-provider-probe');
		return { kind: fetchCalls > 0 ? 'upstash' : 'memory', runtime };
	} finally {
		globalThis.fetch = originalFetch;
	}
}
