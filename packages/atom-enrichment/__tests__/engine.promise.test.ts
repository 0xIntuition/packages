import { describe, expect, it } from 'bun:test';
import {
	type CacheAdapter,
	type CachedEntry,
	createUpstashCacheAdapter,
	toCancellableCacheAdapter,
} from '../src/cache';
import { createEnrichmentEngine } from '../src/engine';
import { createMockArtifact, createMockPlugin, createMockRequest } from '../src/testing';
import type { EnrichmentArtifact } from '../src/types';

const TEST_TIMEOUT_MS = 1_000;
describe('Promise engine orchestration', () => {
	it('keeps the Promise facade non-rejecting and classified on parent abort', async () => {
		let markStarted: (() => void) | undefined;
		const started = new Promise<void>((resolve) => {
			markStarted = resolve;
		});
		let observedSignal: AbortSignal | undefined;
		const engine = createEnrichmentEngine({
			plugins: [
				createMockPlugin({
					id: 'aa-completed-plugin',
					mockArtifacts: [createMockArtifact()],
				}),
				createMockPlugin({
					id: 'bb-not-applicable',
					supports: () => false,
				}),
				createMockPlugin({
					id: 'promise-interrupt-plugin',
					enrich: async (_request, context) => {
						observedSignal = context.signal;
						markStarted?.();
						return await new Promise<EnrichmentArtifact[]>(() => {});
					},
				}),
			],
		});
		const controller = new AbortController();
		const run = engine.enrich(createMockRequest({ concurrency: 1 }), {
			signal: controller.signal,
		});

		await started;
		await Bun.sleep(10);
		controller.abort(new Error('parent cancelled enrichment'));
		const result = await resolvesWithin(run);

		expect(observedSignal?.aborted).toBe(true);
		expect(result.status).toBe('partial');
		expect(result.artifacts).toHaveLength(1);
		expect(result.skipped).toContainEqual({
			pluginId: 'bb-not-applicable',
			reason: 'not_applicable',
		});
		expect(result.errors).toEqual([
			{
				pluginId: 'promise-interrupt-plugin',
				code: 'internal_error',
				message: 'parent cancelled enrichment',
				retriable: false,
			},
		]);
	});

	it('evaluates support before classifying a pre-aborted domain signal', async () => {
		const supportCalls: string[] = [];
		let applicableCalls = 0;
		const engine = createEnrichmentEngine({
			plugins: [
				createMockPlugin({
					id: 'aa-not-applicable',
					supports: () => {
						supportCalls.push('aa-not-applicable');
						return false;
					},
				}),
				createMockPlugin({
					id: 'bb-support-fails',
					supports: () => {
						supportCalls.push('bb-support-fails');
						throw new Error('supports exploded');
					},
				}),
				createMockPlugin({
					id: 'cc-applicable',
					supports: () => {
						supportCalls.push('cc-applicable');
						return true;
					},
					enrich: async () => {
						applicableCalls += 1;
						return [];
					},
				}),
			],
		});
		const controller = new AbortController();
		controller.abort(new Error('pre-aborted by parent'));

		const result = await engine.enrich(createMockRequest(), { signal: controller.signal });

		expect(supportCalls).toEqual(['aa-not-applicable', 'bb-support-fails', 'cc-applicable']);
		expect(applicableCalls).toBe(0);
		expect(result.skipped).toEqual([
			{
				pluginId: 'aa-not-applicable',
				reason: 'not_applicable',
			},
		]);
		expect(result.errors).toEqual([
			{
				pluginId: 'bb-support-fails',
				code: 'internal_error',
				message: 'supports() failed: supports exploded',
				retriable: false,
			},
			{
				pluginId: 'cc-applicable',
				code: 'internal_error',
				message: 'pre-aborted by parent',
				retriable: false,
			},
		]);
		expect(Object.keys(result.timings.perPluginMs)).toEqual(['cc-applicable']);
	});

	it('retains completed output when domain cancellation interrupts cache set', async () => {
		let markSetStarted: (() => void) | undefined;
		const setStarted = new Promise<void>((resolve) => {
			markSetStarted = resolve;
		});
		let setSignal: AbortSignal | undefined;
		const cache = {
			signalAware: true as const,
			get: async () => null,
			set: async (
				_key: string,
				_entry: CachedEntry,
				_ttlMs: number,
				options?: { signal?: AbortSignal }
			) => {
				setSignal = options?.signal;
				markSetStarted?.();
				return await new Promise<void>((_resolve, reject) => {
					if (setSignal?.aborted) {
						reject(setSignal.reason);
						return;
					}
					setSignal?.addEventListener('abort', () => reject(setSignal?.reason), {
						once: true,
					});
				});
			},
			delete: async () => {},
		};
		const engine = createEnrichmentEngine({
			cache,
			plugins: [
				createMockPlugin({
					id: 'cache-set-success',
					TTL: 60,
					mockArtifacts: [createMockArtifact()],
				}),
			],
		});
		const controller = new AbortController();
		const run = engine.enrich(createMockRequest(), { signal: controller.signal });

		await resolvesWithin(setStarted);
		controller.abort(new Error('abort while writing cache'));
		const result = await resolvesWithin(run);

		expect(setSignal?.aborted).toBe(true);
		expect(result.status).toBe('success');
		expect(result.artifacts).toHaveLength(1);
		expect(result.errors).toEqual([]);
		expect(result.timings.cacheMisses).toBe(1);
		expect(Object.keys(result.timings.perPluginMs)).toEqual(['cache-set-success']);
	});

	it('preserves ordered partial progress when cancellation reaches queued work', async () => {
		let markSecondStarted: (() => void) | undefined;
		const secondStarted = new Promise<void>((resolve) => {
			markSecondStarted = resolve;
		});
		const calls: string[] = [];
		const engine = createEnrichmentEngine({
			concurrency: 1,
			plugins: [
				createMockPlugin({
					id: 'aa-completed',
					enrich: async () => {
						calls.push('aa-completed');
						return [createMockArtifact()];
					},
				}),
				createMockPlugin({
					id: 'bb-in-flight',
					enrich: async () => {
						calls.push('bb-in-flight');
						markSecondStarted?.();
						return await new Promise<EnrichmentArtifact[]>(() => {});
					},
				}),
				createMockPlugin({
					id: 'cc-not-started',
					enrich: async () => {
						calls.push('cc-not-started');
						return [];
					},
				}),
			],
		});
		const controller = new AbortController();
		const run = engine.enrich(createMockRequest({ concurrency: 1 }), {
			signal: controller.signal,
		});

		await resolvesWithin(secondStarted);
		controller.abort(new Error('cancel queued work'));
		const result = await resolvesWithin(run);

		expect(calls).toEqual(['aa-completed', 'bb-in-flight']);
		expect(result.status).toBe('partial');
		expect(result.artifacts).toHaveLength(1);
		expect(result.errors).toEqual([
			{
				pluginId: 'bb-in-flight',
				code: 'internal_error',
				message: 'cancel queued work',
				retriable: false,
			},
			{
				pluginId: 'cc-not-started',
				code: 'internal_error',
				message: 'cancel queued work',
				retriable: false,
			},
		]);
		expect(Object.keys(result.timings.perPluginMs)).toEqual([
			'aa-completed',
			'bb-in-flight',
			'cc-not-started',
		]);
	});

	it('abandons a hanging legacy cache get promptly on parent abort', async () => {
		let markCacheStarted: (() => void) | undefined;
		const cacheStarted = new Promise<void>((resolve) => {
			markCacheStarted = resolve;
		});
		const cache: CacheAdapter = {
			get: async () => {
				markCacheStarted?.();
				return await new Promise<CachedEntry | null>(() => {});
			},
			set: async () => {},
			delete: async () => {},
		};
		const engine = createEnrichmentEngine({
			cache,
			plugins: [createMockPlugin({ id: 'hanging-cache-plugin', TTL: 60 })],
		});
		const controller = new AbortController();
		const run = engine.enrich(createMockRequest(), { signal: controller.signal });

		await cacheStarted;
		controller.abort(new Error('cache wait cancelled'));
		const result = await resolvesWithin(run);

		expect(result.status).toBe('failed');
		expect(result.errors[0]?.message).toBe('cache wait cancelled');
	});

	it('passes signals to an explicitly marked cache with default parameters', async () => {
		let getSignal: AbortSignal | undefined;
		let setSignal: AbortSignal | undefined;
		let deleteSignal: AbortSignal | undefined;
		const cache = {
			signalAware: true as const,
			async get(_key: string, options: { signal?: AbortSignal } = {}) {
				getSignal = options?.signal;
				return {
					artifacts: [],
					cachedAt: '1970-01-01T00:00:00.000Z',
					ttlMs: 1,
				};
			},
			async set(
				_key: string,
				_entry: CachedEntry,
				_ttlMs: number,
				options: { signal?: AbortSignal } = {}
			) {
				setSignal = options?.signal;
			},
			async delete(_key: string, options: { signal?: AbortSignal } = {}) {
				deleteSignal = options?.signal;
			},
		};
		const engine = createEnrichmentEngine({
			cache,
			plugins: [createMockPlugin({ id: 'signal-cache-plugin', TTL: 60 })],
		});

		const result = await engine.enrich(createMockRequest());

		expect(result.status).toBe('success');
		expect(getSignal).toBeInstanceOf(AbortSignal);
		expect(setSignal).toBeInstanceOf(AbortSignal);
		expect(deleteSignal).toBeInstanceOf(AbortSignal);
	});

	it('keeps original argument counts for an unmarked legacy cache', async () => {
		const argumentCounts: number[] = [];
		const cache: CacheAdapter = {
			get: async (...args: [string]) => {
				argumentCounts.push(args.length);
				return {
					artifacts: [],
					cachedAt: '1970-01-01T00:00:00.000Z',
					ttlMs: 1,
				};
			},
			set: async (...args: [string, CachedEntry, number]) => {
				argumentCounts.push(args.length);
			},
			delete: async (...args: [string]) => {
				argumentCounts.push(args.length);
			},
		};
		const engine = createEnrichmentEngine({
			cache,
			plugins: [createMockPlugin({ id: 'legacy-cache-plugin', TTL: 60 })],
		});

		const result = await engine.enrich(createMockRequest());

		expect(result.status).toBe('success');
		expect(argumentCounts).toEqual([1, 1, 3]);
	});

	it('composes parent cancellation into the Upstash request signal', async () => {
		let markFetchStarted: (() => void) | undefined;
		const fetchStarted = new Promise<void>((resolve) => {
			markFetchStarted = resolve;
		});
		let fetchSignal: AbortSignal | undefined;
		const fetcher = (async (_input: RequestInfo | URL, init?: RequestInit) => {
			fetchSignal = init?.signal ?? undefined;
			markFetchStarted?.();
			return await new Promise<Response>((_resolve, reject) => {
				if (fetchSignal?.aborted) {
					reject(fetchSignal.reason);
					return;
				}
				fetchSignal?.addEventListener('abort', () => reject(fetchSignal?.reason), {
					once: true,
				});
			});
		}) as typeof fetch;
		const cache = toCancellableCacheAdapter(
			createUpstashCacheAdapter({
				baseUrl: 'https://cache.example',
				token: 'test-token',
				fetcher,
				httpTimeoutMs: 2_000,
			})
		);
		const controller = new AbortController();
		let activeAbortListeners = 0;
		const addEventListener = controller.signal.addEventListener.bind(controller.signal);
		const removeEventListener = controller.signal.removeEventListener.bind(controller.signal);
		controller.signal.addEventListener = ((
			...args: Parameters<AbortSignal['addEventListener']>
		) => {
			if (args[0] === 'abort') {
				activeAbortListeners += 1;
			}
			return addEventListener(...args);
		}) as AbortSignal['addEventListener'];
		controller.signal.removeEventListener = ((
			...args: Parameters<AbortSignal['removeEventListener']>
		) => {
			if (args[0] === 'abort') {
				activeAbortListeners -= 1;
			}
			return removeEventListener(...args);
		}) as AbortSignal['removeEventListener'];
		const read = cache.get('key', { signal: controller.signal });

		await resolvesWithin(fetchStarted);
		controller.abort(new Error('cancel Upstash request'));
		const error = await resolvesWithin(read.catch((cause: unknown) => cause));

		expect(fetchSignal?.aborted).toBe(true);
		expect(error).toBeInstanceOf(Error);
		expect((error as Error).message).toBe('cancel Upstash request');
		expect(activeAbortListeners).toBe(0);
	});

	it('starts later plugins as soon as a bounded slot becomes free', async () => {
		let releaseSlow: (() => void) | undefined;
		const slowGate = new Promise<void>((resolve) => {
			releaseSlow = resolve;
		});
		let markLaterStarted: (() => void) | undefined;
		const laterStarted = new Promise<void>((resolve) => {
			markLaterStarted = resolve;
		});
		let slowFinished = false;
		const engine = createEnrichmentEngine({
			concurrency: 2,
			plugins: [
				createMockPlugin({
					id: 'aa-slow-plugin',
					enrich: async () => {
						await slowGate;
						slowFinished = true;
						return [];
					},
				}),
				createMockPlugin({ id: 'bb-fast-plugin', mockArtifacts: [] }),
				createMockPlugin({
					id: 'cc-later-plugin',
					enrich: async () => {
						markLaterStarted?.();
						return [];
					},
				}),
			],
		});
		const run = engine.enrich(createMockRequest({ concurrency: 2 }));

		await resolvesWithin(laterStarted);
		expect(slowFinished).toBe(false);
		releaseSlow?.();
		expect((await run).status).toBe('success');
	});

	it('keeps error accumulation in plugin registration order', async () => {
		const engine = createEnrichmentEngine({
			plugins: [
				createMockPlugin({
					id: 'aa-slow-error',
					enrich: async () => {
						await Bun.sleep(20);
						throw new Error('first error');
					},
				}),
				createMockPlugin({
					id: 'bb-fast-error',
					mockError: new Error('second error'),
				}),
			],
		});

		const result = await engine.enrich(createMockRequest());

		expect(result.errors.map((error) => error.pluginId)).toEqual([
			'aa-slow-error',
			'bb-fast-error',
		]);
	});

	it('places support errors before registration-ordered execution errors', async () => {
		const engine = createEnrichmentEngine({
			plugins: [
				createMockPlugin({
					id: 'aa-execution-error',
					mockError: new Error('execution exploded'),
				}),
				createMockPlugin({
					id: 'bb-support-error',
					supports: () => {
						throw new Error('support exploded');
					},
				}),
				createMockPlugin({
					id: 'cc-validation-error',
					mockArtifacts: [createMockArtifact({ artifact_type: 'unknown-artifact' })],
				}),
			],
		});

		const result = await engine.enrich(createMockRequest());

		expect(result.errors.map((error) => error.pluginId)).toEqual([
			'bb-support-error',
			'aa-execution-error',
			'cc-validation-error',
		]);
		expect(result.errors.map((error) => error.code)).toEqual([
			'internal_error',
			'internal_error',
			'validation_error',
		]);
	});

	it('uses one non-retried package timeout with the exact legacy error', async () => {
		let calls = 0;
		const engine = createEnrichmentEngine({
			plugins: [
				createMockPlugin({
					id: 'single-timeout-plugin',
					enrich: async () => {
						calls += 1;
						return await new Promise<EnrichmentArtifact[]>(() => {});
					},
				}),
			],
		});

		const result = await engine.enrich(createMockRequest({ timeoutMs: 20 }));

		expect(calls).toBe(1);
		expect(result.errors).toEqual([
			{
				pluginId: 'single-timeout-plugin',
				code: 'timeout',
				message: 'Plugin timed out after 20ms',
				retriable: true,
			},
		]);
	});

	it('contains invalid plugin output while retaining sibling artifacts', async () => {
		const retainedArtifact = createMockArtifact();
		const engine = createEnrichmentEngine({
			plugins: [
				createMockPlugin({
					id: 'aa-invalid-output',
					enrich: async () => ({ invalid: true }) as unknown as EnrichmentArtifact[],
				}),
				createMockPlugin({
					id: 'bb-valid-output',
					mockArtifacts: [retainedArtifact],
				}),
			],
		});

		const result = await engine.enrich(createMockRequest());

		expect(result.status).toBe('partial');
		expect(result.artifacts).toHaveLength(1);
		expect(result.artifacts[0]?.meta.pluginId).toBe('bb-valid-output');
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0]).toMatchObject({
			pluginId: 'aa-invalid-output',
			code: 'internal_error',
			retriable: false,
		});
	});
});

async function resolvesWithin<T>(promise: Promise<T>): Promise<T> {
	return await Promise.race([
		promise,
		Bun.sleep(TEST_TIMEOUT_MS).then(() => {
			throw new Error(`Promise did not resolve within ${TEST_TIMEOUT_MS}ms.`);
		}),
	]);
}
