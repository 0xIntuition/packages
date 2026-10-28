import { describe, expect, it } from 'bun:test';
import { defineEnrichmentPlugin } from '@0xintuition/atom-enrichment';

import { createProcessingRuntime, SHARED_ENRICHMENT_REGISTRY_ERROR } from '../src/runtime';

const FIXED_TIME = '2040-01-01T00:00:00.000Z';
const REQUIRED_CLASSIFIER_SINK = () => undefined;
// Base oracle: 9dbd23e91bb827b159557830d84e7b2e74f87ba2.
const BASE_DEFAULT_PROCESSING_FINGERPRINT =
	'processing-v1:8950483d4d7ec82b080b7f638bfaa0cc2aa6d6298e442c38a68a2e16c0d84b1a';

describe('Wave 3D processing execution services', () => {
	it('preserves the base fingerprint when no execution service is injected', () => {
		const runtime = createProcessingRuntime({
			env: {},
			cache: { provider: 'none' },
			classification: { onClassifierError: REQUIRED_CLASSIFIER_SINK },
		});

		expect(runtime.fingerprint).toBe(BASE_DEFAULT_PROCESSING_FINGERPRINT);
	});

	it('fingerprints execution-service presence without function identity', () => {
		const first = createProcessingRuntime({
			env: {},
			cache: { provider: 'none' },
			classification: { onClassifierError: REQUIRED_CLASSIFIER_SINK },
			now: () => FIXED_TIME,
			random: () => 0.25,
			cacheFetcher: async () => new Response('{"result":null}'),
		});
		const second = createProcessingRuntime({
			env: {},
			cache: { provider: 'none' },
			classification: { onClassifierError: REQUIRED_CLASSIFIER_SINK },
			now: () => '2099-12-31T23:59:59.999Z',
			random: () => 0.75,
			cacheFetcher: async () => new Response('{"result":"different"}'),
		});
		const omitted = createProcessingRuntime({
			env: {},
			cache: { provider: 'none' },
			classification: { onClassifierError: REQUIRED_CLASSIFIER_SINK },
		});
		const cacheFetcherOnly = createProcessingRuntime({
			env: {},
			cache: { provider: 'none' },
			classification: { onClassifierError: REQUIRED_CLASSIFIER_SINK },
			cacheFetcher: async () => new Response('{"result":null}'),
		});

		expect(first.fingerprint).toBe(second.fingerprint);
		expect(first.fingerprint).not.toBe(omitted.fingerprint);
		expect(cacheFetcherOnly.fingerprint).not.toBe(omitted.fingerprint);
	});

	it('allows loopback HTTP only with an injected cache fetcher', async () => {
		const requests: string[] = [];
		const runtime = createProcessingRuntime({
			env: {
				UPSTASH_REDIS_REST_TOKEN: 'test-token',
				UPSTASH_REDIS_REST_URL: 'http://127.0.0.1:48123',
			},
			cache: { provider: 'upstash' },
			classification: { onClassifierError: REQUIRED_CLASSIFIER_SINK },
			cacheFetcher: async (input) => {
				requests.push(String(input));
				return new Response('{"result":null}', {
					headers: { 'content-type': 'application/json' },
					status: 200,
				});
			},
		});

		expect(runtime.cacheProvider).toBe('upstash');
		expect(await runtime.caches.enrichment?.get('fixture-key')).toBeNull();
		expect(requests).toEqual(['http://127.0.0.1:48123/get/fixture-key']);
		expect(() =>
			createProcessingRuntime({
				env: {
					UPSTASH_REDIS_REST_TOKEN: 'test-token',
					UPSTASH_REDIS_REST_URL: 'http://127.0.0.1:48123',
				},
				cache: { provider: 'upstash' },
				classification: { onClassifierError: REQUIRED_CLASSIFIER_SINK },
			})
		).toThrow('An injected cacheFetcher may use http://127.0.0.1');
		expect(() =>
			createProcessingRuntime({
				env: {
					UPSTASH_REDIS_REST_TOKEN: 'test-token',
					UPSTASH_REDIS_REST_URL: 'http://localhost:48123',
				},
				cache: { provider: 'upstash' },
				classification: { onClassifierError: REQUIRED_CLASSIFIER_SINK },
				cacheFetcher: fetch,
			})
		).toThrow('An injected cacheFetcher may use http://127.0.0.1');
	});
});

describe('Wave 3D shared enrichment engines', () => {
	it('publishes one engine per preset and seals its registry on first use', async () => {
		const plugin = createProbePlugin();
		const runtime = createProcessingRuntime(
			{
				env: {},
				cache: { provider: 'none' },
				classification: { onClassifierError: REQUIRED_CLASSIFIER_SINK },
			},
			{
				pluginOverrides: {
					classification: [],
					enrichment: { default: [plugin], company: [plugin] },
				},
			}
		);

		const first = runtime.enrichment.createEngine('default');
		const second = runtime.enrichment.createEngine('default');
		const otherPreset = runtime.enrichment.createEngine('company');

		expect(second).toBe(first);
		expect(otherPreset).not.toBe(first);
		expect(first.listPlugins().map((entry) => entry.id)).toEqual(['reuse-probe']);
		const inFlight = first.enrich(createRequest('publication-guard'));
		expect(() => first.registerPlugin(plugin)).toThrow(SHARED_ENRICHMENT_REGISTRY_ERROR);
		expect(() => first.unregisterPlugin('reuse-probe')).toThrow(SHARED_ENRICHMENT_REGISTRY_ERROR);
		expect((await inFlight).status).toBe('success');
	});

	it('keeps concurrent request signals isolated on the reused engine', async () => {
		const runtime = createProcessingRuntime(
			{
				env: {},
				cache: { provider: 'none' },
				classification: { onClassifierError: REQUIRED_CLASSIFIER_SINK },
			},
			{
				pluginOverrides: {
					classification: [],
					enrichment: { default: [createProbePlugin()] },
				},
			}
		);
		const engine = runtime.enrichment.createEngine('default');
		const aborted = new AbortController();
		const survivor = new AbortController();
		const abortedRun = engine.enrich(createRequest('aborted'), {
			signal: aborted.signal,
		});
		const survivorRun = engine.enrich(createRequest('survivor'), {
			signal: survivor.signal,
		});
		aborted.abort(new DOMException('request A cancelled', 'AbortError'));

		const [cancelled, completed] = await Promise.all([abortedRun, survivorRun]);

		expect(cancelled.errors).toEqual([
			expect.objectContaining({
				pluginId: 'reuse-probe',
				message: 'request A cancelled',
			}),
		]);
		expect(completed.status).toBe('success');
		expect(completed.artifacts).toHaveLength(1);
		expect(survivor.signal.aborted).toBe(false);
	});
});

function createProbePlugin() {
	return defineEnrichmentPlugin({
		id: 'reuse-probe',
		version: '1.0.0',
		runtime: 'server',
		artifactTypes: ['opengraph'],
		supports: () => true,
		async enrich(request, context) {
			await delayWithSignal(10, context.signal);
			return [
				{
					artifact_type: 'opengraph',
					data: { title: request.traceId ?? 'probe' },
					meta: {
						fetchedAt: context.now(),
						pluginId: 'reuse-probe',
						provider: 'reuse-probe',
					},
				},
			];
		},
	});
}

function createRequest(traceId: string) {
	return {
		input: {
			atomType: 'thing' as const,
			jsonLd: {
				'@context': 'https://schema.org',
				'@type': 'Thing',
				name: 'Reuse probe',
			},
			source: {
				classificationEngine: 'wave3d-test',
				classifiedAt: FIXED_TIME,
			},
		},
		runtime: 'server' as const,
		plugins: ['reuse-probe'],
		traceId,
	};
}

async function delayWithSignal(delayMs: number, signal: AbortSignal): Promise<void> {
	signal.throwIfAborted();
	await new Promise<void>((resolve, reject) => {
		const onAbort = () => {
			clearTimeout(timeout);
			reject(signal.reason);
		};
		const timeout = setTimeout(() => {
			signal.removeEventListener('abort', onAbort);
			resolve();
		}, delayMs);
		signal.addEventListener('abort', onAbort, { once: true });
	});
}
