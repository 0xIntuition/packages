import { describe, expect, it } from 'bun:test';
import { createDefaultUrlPlugin, createV0TypeProfilesPlugin } from '../src/plugins/index';
import { createServerEngine } from '../src/server';
import { createDefaultTestPlugins } from './helpers/default-plugins';

const ETSY_URL = 'https://www.etsy.com/listing/1234567890/handmade-blue-mug';

const DECLINED_ETSY_URLS = [
	'https://www.etsy.com/listing/not-a-number/handmade-blue-mug',
	'https://www.etsy.com/listing/0/handmade-blue-mug',
	'https://www.etsy.com/shop/example-shop',
	'https://www.etsy.com/c/home-and-living',
	'https://www.etsy.com/search?q=handmade+blue+mug',
	'https://eviletsy.com/listing/1234567890/handmade-blue-mug',
	'https://etsy.com.evil.com/listing/1234567890/handmade-blue-mug',
] as const;

describe('etsy platform plugin', () => {
	it('proves Etsy listing URLs fall through to WebSite/thing without the plugin', async () => {
		const engine = createServerEngine({
			onClassifierError: () => undefined,
			plugins: createDefaultUrlOnlyPlugins(),
		});

		const result = await engine.classify({
			input: ETSY_URL,
			mode: 'progressive',
			classificationSessionId: 'etsy-default-url-baseline',
		});

		expect(result.classification?.domain).toBe('web');
		expect(result.resolved?.resolverId).toBe('default-url-resolver');
		expect(result.resolved?.atoms[0]).toMatchObject({
			schemaType: 'WebSite',
			category: 'thing',
		});
	});

	it('classifies Etsy listing URLs as a deterministic Product keyed by listing id', async () => {
		const engine = createServerEngine({
			onClassifierError: () => undefined,
			plugins: createDefaultTestPlugins(),
		});

		const result = await engine.classify({
			input: ETSY_URL,
			mode: 'progressive',
			classificationSessionId: 'etsy-listing-1234567890',
		});

		expect(result.classification).toMatchObject({
			domain: 'etsy',
			subtype: 'listing',
			meta: {
				listingId: '1234567890',
				canonicalUrl: 'https://www.etsy.com/listing/1234567890',
			},
		});
		expect(result.resolved?.resolverId).toBe('etsy-resolver');
		expect(result.resolved?.atoms[0]).toMatchObject({
			schemaType: 'Product',
			category: 'product',
			title: 'Etsy Listing 1234567890',
			canonicalId: 'etsy:listing:1234567890',
			sameAs: ['https://www.etsy.com/listing/1234567890'],
			metadata: {
				pluginId: 'etsy',
				provider: 'etsy',
				platform: 'etsy',
			},
		});
	});

	for (const input of DECLINED_ETSY_URLS) {
		it(`declines unsupported Etsy URL ${input}`, async () => {
			const engine = createServerEngine({
				onClassifierError: () => undefined,
				plugins: createDefaultTestPlugins(),
			});

			const result = await engine.classify({
				input,
				mode: 'progressive',
				classificationSessionId: `etsy-decline-${DECLINED_ETSY_URLS.indexOf(input)}`,
			});

			expect(result.classification?.domain).toBe('web');
			expect(result.resolved?.resolverId).toBe('default-url-resolver');
			expect(result.resolved?.atoms[0]).toMatchObject({
				schemaType: 'WebSite',
				category: 'thing',
			});
			expect(
				result.resolved?.atoms.some((atom) => atom.canonicalId?.startsWith('etsy:listing:'))
			).toBe(false);
		});
	}
});

function createDefaultUrlOnlyPlugins() {
	return [
		createV0TypeProfilesPlugin(),
		createDefaultUrlPlugin({
			fetch: async () => ({ ok: false, status: 404, text: async () => '' }),
		}),
	];
}
