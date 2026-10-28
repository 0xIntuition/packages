import { beforeEach, describe, expect, it } from 'bun:test';

import { createClassificationEngine } from '../src/engine';
import {
	createAmazonDomainHtmlAdapter,
	createAmazonPlugin,
	createV0TypeProfilesPlugin,
} from '../src/index';
import { resetDomainHtmlHostCircuitBreakersForTests } from '../src/plugins/shared/domain-html/fetch';
import { resolvePublicTestHostname } from './helpers/public-dns';

describe('amazon domain-html adapter', () => {
	beforeEach(() => {
		resetDomainHtmlHostCircuitBreakersForTests();
	});

	it('extracts deterministic identity fields from amazon product html', async () => {
		const engine = createClassificationEngine({
			onClassifierError: () => undefined,
			runtime: 'server',
			plugins: [
				createV0TypeProfilesPlugin(),
				createAmazonPlugin({
					adapters: {
						domainHtml: createAmazonDomainHtmlAdapter({
							resolveHostname: resolvePublicTestHostname,
							fetch: async () => new Response(AMAZON_PRODUCT_HTML),
						}),
					},
				}),
			],
		});

		const result = await engine.classify({
			input: 'https://www.amazon.com/dp/B0916J478T?th=1',
			mode: 'progressive',
			classificationSessionId: 'amazon-domain-html',
		});

		expect(result.status).toBe('complete');
		expect(result.classification?.domain).toBe('amazon');
		expect(result.resolved?.fallbackUsed).toBe(false);
		expect(result.resolved?.atoms[0]?.title).toBe(
			'Carepod One Stainless Steel Humidifier for Large Room'
		);
		expect(result.resolved?.atoms[0]?.canonicalId).toBe('asin:B0916J478T');
		expect(result.resolved?.classifications[0]?.data).toMatchObject({
			image: 'https://m.media-amazon.com/images/I/61vPRPWGPaL._AC_SL1500_.jpg',
		});
		expect(result.resolved?.publishable[0]?.data).toEqual({
			'@context': 'https://schema.org/',
			'@type': 'Product',
			name: 'Carepod One Stainless Steel Humidifier for Large Room',
			url: 'https://www.amazon.com/Carepod-Stainless-Ultrasonic-Humidifier-Whisper-Quiet/dp/B0916J478T',
			sameAs: [
				'https://www.amazon.com/Carepod-Stainless-Ultrasonic-Humidifier-Whisper-Quiet/dp/B0916J478T',
			],
			sku: 'B0916J478T',
			brand: 'Carepod',
		});
		expect(result.resolved?.publishable[0]?.data).not.toHaveProperty('image');

		const metadata = engine.getLastMetadata();
		expect(metadata.platformResolver).toEqual({
			domain: 'amazon',
			fallbackStage: 'domain-html',
			attemptedStages: ['domain-html'],
			skippedStages: ['domain-api:no-credentials'],
			stageErrors: [],
		});
	});

	it('names the open host and breaker state in the domain-html classify diagnostic', async () => {
		let fetchCallCount = 0;
		const engine = createClassificationEngine({
			onClassifierError: () => undefined,
			runtime: 'server',
			plugins: [
				createV0TypeProfilesPlugin(),
				createAmazonPlugin({
					adapters: {
						domainHtml: createAmazonDomainHtmlAdapter({
							resolveHostname: resolvePublicTestHostname,
							fetch: async () => {
								fetchCallCount += 1;
								return new Response('', { status: 503 });
							},
						}),
					},
				}),
			],
		});

		let finalResult: Awaited<ReturnType<typeof engine.classify>> | undefined;
		for (let index = 0; index < 4; index += 1) {
			finalResult = await engine.classify({
				input: `https://www.amazon.com/dp/B0916J47${index}T`,
				mode: 'progressive',
				classificationSessionId: `amazon-domain-html-open-${index}`,
			});
		}

		expect(fetchCallCount).toBe(3);
		expect(finalResult?.resolverErrors?.map((error) => error.message).join('\n')).toMatch(
			/domain-html:circuit_open: Host www\.amazon\.com circuit is open \(failures=3, openForMs=\d+, resetAfterMs=300000\)/
		);
	});
});

const AMAZON_PRODUCT_HTML = `
<!doctype html>
<html lang="en-us">
<head>
  <link rel="canonical" href="https://www.amazon.com/Carepod-Stainless-Ultrasonic-Humidifier-Whisper-Quiet/dp/B0916J478T" />
  <meta name="title" content="Amazon.com: Carepod One Stainless Steel Humidifier for Large Room : Home & Kitchen" />
  <meta name="description" content="Amazon.com: Carepod One Stainless Steel Humidifier for Large Room : Home & Kitchen" />
  <title>Amazon.com: Carepod One Stainless Steel Humidifier for Large Room : Home & Kitchen</title>
</head>
<body>
  <span id="productTitle">
    Carepod One Stainless Steel Humidifier for Large Room
  </span>
  <a id="bylineInfo" href="/stores/Carepod/page/example">Visit the Carepod Store</a>
  <div data-old-hires="https://m.media-amazon.com/images/I/61vPRPWGPaL._AC_SL1500_.jpg"></div>
</body>
</html>
`;
