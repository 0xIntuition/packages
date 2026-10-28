import { describe, expect, it } from 'bun:test';
import { createAmazonDomainApiAdapter } from '../src/plugins/amazon/domain-api-adapter';
import type { PlatformStageInput } from '../src/plugins/shared/platform';
import { createXDomainApiAdapter } from '../src/plugins/x/domain-api-adapter';

describe('HTTP error redaction', () => {
	for (const provider of ['amazon', 'x'] as const) {
		it(`${provider} exposes only status and service name`, async () => {
			let bodyRead = false;
			const fetch = async () => ({
				ok: false,
				status: 403,
				text: async () => {
					bodyRead = true;
					return 'SECRET_TOKEN=private';
				},
				json: async () => ({}),
			});
			const adapter =
				provider === 'amazon'
					? createAmazonDomainApiAdapter({ apiKey: 'secret', fetch })
					: createXDomainApiAdapter({ token: 'secret', fetch });
			const canonicalUrl =
				provider === 'amazon'
					? 'https://www.amazon.com/dp/B000000001'
					: 'https://x.com/example/status/123456';
			const input: PlatformStageInput = {
				runtime: 'server',
				now: new Date(0).toISOString(),
				domain: provider,
				canonicalUrl,
				requestInput: canonicalUrl,
				stageContext: new Map(),
				classification: {
					type: 'url',
					domain: provider,
					subtype: provider === 'amazon' ? 'product' : 'post',
					confidence: 1,
					meta: { asin: 'B000000001', postId: '123456' },
				},
			};
			await expect(adapter(input)).rejects.toThrow(
				provider === 'amazon' ? 'HTTP 403 from Canopy Amazon API.' : 'HTTP 403 from X API.'
			);
			expect(bodyRead).toBe(false);
		});
	}
});
