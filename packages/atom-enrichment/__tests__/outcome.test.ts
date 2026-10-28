import { expect, test } from 'bun:test';
import { createEnrichmentEngine } from '../src/engine';
import { enrichOutcome } from '../src/outcome';
import { createMockPlugin, createMockRequest } from '../src/testing';

test('outcome captures validation failures and preserves completed results through both entry points', async () => {
	const engine = createEnrichmentEngine();
	expect((await enrichOutcome(engine, createMockRequest())).kind).toBe('success');
	expect((await engine.enrichOutcome!(createMockRequest())).kind).toBe('success');
	const invalid = { ...createMockRequest(), timeoutMs: 0 };
	expect((await enrichOutcome(engine, invalid)).kind).toBe('failure');
	expect((await engine.enrichOutcome!(invalid)).kind).toBe('failure');
	await expect(engine.enrich(invalid)).rejects.toThrow();
});

test('support and provider errors redact credential-bearing diagnostics', async () => {
	const error = new Error(
		'fetch https://user:SECRET@api.example.com/path?token=SECRET Authorization: Bearer SECRET'
	);
	const engine = createEnrichmentEngine({
		plugins: [
			createMockPlugin({
				id: 'aa-support-error',
				supports() {
					throw error;
				},
			}),
			createMockPlugin({ id: 'bb-provider-error', mockError: error }),
		],
	});
	const result = await engine.enrich(createMockRequest());
	expect(result.errors).toHaveLength(2);
	expect(JSON.stringify(result.errors)).not.toContain('SECRET');
	expect(result.errors[1]?.code).toBe('auth_failed');
});
