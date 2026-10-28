import { describe, expect, it } from 'bun:test';

import { createUpstashClassificationCacheAdapterFromEnv } from '../src/cache';

const TEST_URL = 'https://example.invalid';
const TEST_TOKEN = 'test-token';
const fetcher = (async () =>
	new Response(JSON.stringify({ result: null }), { status: 200 })) as unknown as typeof fetch;

describe('legacy classification Upstash environment overloads', () => {
	it('treats empty and keyed options objects as legacy options', () => {
		const previousUrl = process.env.UPSTASH_REDIS_REST_URL;
		const previousToken = process.env.UPSTASH_REDIS_REST_TOKEN;

		try {
			process.env.UPSTASH_REDIS_REST_URL = TEST_URL;
			process.env.UPSTASH_REDIS_REST_TOKEN = TEST_TOKEN;

			expect(createUpstashClassificationCacheAdapterFromEnv({})).toBeDefined();
			expect(createUpstashClassificationCacheAdapterFromEnv({ fetcher })).toBeDefined();
			expect(createUpstashClassificationCacheAdapterFromEnv({ httpTimeoutMs: 25 })).toBeDefined();
		} finally {
			restoreEnvironmentValue('UPSTASH_REDIS_REST_URL', previousUrl);
			restoreEnvironmentValue('UPSTASH_REDIS_REST_TOKEN', previousToken);
		}
	});
});

function restoreEnvironmentValue(key: string, value: string | undefined): void {
	if (value === undefined) {
		delete process.env[key];
		return;
	}

	process.env[key] = value;
}
