import { describe, expect, it } from 'bun:test';

import { createProcessingRuntime } from '../src';

const REQUIRED_CLASSIFIER_SINK = () => undefined;

describe('processing runtime fix-round validation and fingerprinting', () => {
	it('validates effective Upstash credentials at the zod boundary without leaking them', () => {
		const sensitiveHost = 'private-cache.example.invalid';
		const sensitiveToken = 'never-echo-this-token';

		for (const url of ['not a url', `http://${sensitiveHost}`]) {
			let thrown: unknown;
			try {
				createProcessingRuntime({
					env: {
						UPSTASH_REDIS_REST_URL: url,
						UPSTASH_REDIS_REST_TOKEN: sensitiveToken,
					},
					cache: { provider: 'upstash' },
					classification: { onClassifierError: REQUIRED_CLASSIFIER_SINK },
				});
			} catch (error) {
				thrown = error;
			}

			expect(thrown).toBeDefined();
			expect(String(thrown)).not.toContain(sensitiveHost);
			expect(String(thrown)).not.toContain(sensitiveToken);
		}

		expect(() =>
			createProcessingRuntime({
				env: {
					UPSTASH_REDIS_REST_URL: 'https://example.invalid',
					UPSTASH_REDIS_REST_TOKEN: 'valid-test-token',
				},
				cache: { provider: 'upstash' },
				classification: { onClassifierError: REQUIRED_CLASSIFIER_SINK },
			})
		).not.toThrow();
	});

	it('fingerprints resolver sink presence without classifier sink function identity', () => {
		const resolverSink = () => undefined;
		const classifierFirst = createProcessingRuntime({
			env: {},
			cache: { provider: 'none' },
			classification: { onClassifierError: () => undefined },
		});
		const classifierSecond = createProcessingRuntime({
			env: {},
			cache: { provider: 'none' },
			classification: {
				onClassifierError: () => {
					throw new Error('function identity is not fingerprint input');
				},
			},
		});
		const resolver = createProcessingRuntime({
			env: {},
			cache: { provider: 'none' },
			classification: {
				onClassifierError: REQUIRED_CLASSIFIER_SINK,
				onResolverError: resolverSink,
			},
		});

		expect(classifierSecond.fingerprint).toBe(classifierFirst.fingerprint);
		expect(resolver.fingerprint).not.toBe(classifierFirst.fingerprint);
	});
});
