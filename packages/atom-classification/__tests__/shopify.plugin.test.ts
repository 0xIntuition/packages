import { describe, expect, it } from 'bun:test';
import { createDefaultUrlPlugin, createV0TypeProfilesPlugin } from '../src/plugins/index';
import { createServerEngine } from '../src/server';
import { createDefaultTestPlugins } from './helpers/default-plugins';

const SHOPIFY_URL = 'https://acme-store.myshopify.com/products/handmade-blue-mug';

describe('shopify platform plugin', () => {
	it('proves anchored Shopify product URLs fall through to WebSite/thing without the plugin', async () => {
		const engine = createServerEngine({
			onClassifierError: () => undefined,
			plugins: createDefaultUrlOnlyPlugins(),
		});

		const result = await engine.classify({
			input: SHOPIFY_URL,
			mode: 'progressive',
			classificationSessionId: 'shopify-default-url-baseline',
		});

		expect(result.classification?.domain).toBe('web');
		expect(result.resolved?.resolverId).toBe('default-url-resolver');
		expect(result.resolved?.atoms[0]).toMatchObject({
			schemaType: 'WebSite',
			category: 'thing',
		});
	});

	it('classifies myshopify.com product URLs as host-and-slug-scoped Products', async () => {
		const engine = createServerEngine({
			onClassifierError: () => undefined,
			plugins: createDefaultTestPlugins(),
		});

		const result = await engine.classify({
			input: SHOPIFY_URL,
			mode: 'progressive',
			classificationSessionId: 'shopify-acme-handmade-blue-mug',
		});

		expect(result.classification).toMatchObject({
			domain: 'shopify',
			subtype: 'product',
			meta: {
				host: 'acme-store.myshopify.com',
				slug: 'handmade-blue-mug',
				canonicalUrl: SHOPIFY_URL,
			},
		});
		expect(result.resolved?.resolverId).toBe('shopify-resolver');
		expect(result.resolved?.atoms[0]).toMatchObject({
			schemaType: 'Product',
			category: 'product',
			title: 'Handmade Blue Mug',
			canonicalId: 'shopify:product:acme-store.myshopify.com:handmade-blue-mug',
			sameAs: [SHOPIFY_URL],
			metadata: {
				pluginId: 'shopify',
				provider: 'shopify',
				platform: 'shopify',
			},
		});
	});

	it('declines custom-domain and generic product paths', async () => {
		const engine = createServerEngine({
			onClassifierError: () => undefined,
			plugins: createDefaultTestPlugins(),
		});

		for (const input of [
			'https://shop.example.com/products/handmade-blue-mug',
			'https://acme-store.myshopify.com/product/handmade-blue-mug',
		]) {
			const result = await engine.classify({
				input,
				mode: 'progressive',
				classificationSessionId: `shopify-declined-${input}`,
			});

			expect(result.classification?.domain).toBe('web');
			expect(result.resolved?.resolverId).toBe('default-url-resolver');
			expect(result.resolved?.atoms[0]?.schemaType).toBe('WebSite');
		}
	});
});

function createDefaultUrlOnlyPlugins() {
	return [
		createV0TypeProfilesPlugin(),
		createDefaultUrlPlugin({
			fetch: async () => ({ ok: false, status: 404, text: async () => '' }),
		}),
	];
}
