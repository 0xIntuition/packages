import { describe, expect, it } from 'bun:test';
import { createDefaultUrlPlugin, createV0TypeProfilesPlugin } from '../src/plugins/index';
import { createServerEngine } from '../src/server';
import { createDefaultTestPlugins } from './helpers/default-plugins';

const COINMARKETCAP_URL = 'https://coinmarketcap.com/currencies/bitcoin/';

const DECLINED_COINMARKETCAP_URLS = [
	'https://coinmarketcap.com/exchanges/binance/',
	'https://coinmarketcap.com/rankings/exchanges/',
	'https://coinmarketcap.com/fr/currencies/bitcoin',
	'https://evilcoinmarketcap.com/currencies/bitcoin/',
	'https://coinmarketcap.com.evil.com/currencies/bitcoin/',
] as const;

describe('coinmarketcap platform plugin', () => {
	it('proves CoinMarketCap URLs fall through to WebSite/thing without the plugin', async () => {
		const engine = createServerEngine({
			onClassifierError: () => undefined,
			plugins: createDefaultUrlOnlyPlugins(),
		});

		const result = await engine.classify({
			input: COINMARKETCAP_URL,
			mode: 'progressive',
			classificationSessionId: 'coinmarketcap-default-url-baseline',
		});

		expect(result.classification?.domain).toBe('web');
		expect(result.resolved?.resolverId).toBe('default-url-resolver');
		expect(result.resolved?.atoms[0]).toMatchObject({
			schemaType: 'WebSite',
			category: 'thing',
		});
	});

	it('classifies CoinMarketCap currency URLs as a deterministic Cryptocurrency', async () => {
		const engine = createServerEngine({
			onClassifierError: () => undefined,
			plugins: createDefaultTestPlugins(),
		});

		const result = await engine.classify({
			input: COINMARKETCAP_URL,
			mode: 'progressive',
			classificationSessionId: 'coinmarketcap-bitcoin',
		});

		expect(result.classification).toMatchObject({
			domain: 'coinmarketcap',
			subtype: 'currency',
			meta: {
				slug: 'bitcoin',
				canonicalUrl: COINMARKETCAP_URL,
			},
		});
		expect(result.resolved?.resolverId).toBe('coinmarketcap-resolver');
		expect(result.resolved?.atoms[0]).toMatchObject({
			schemaType: 'Cryptocurrency',
			category: 'thing',
			title: 'Bitcoin',
			canonicalId: 'coinmarketcap:bitcoin',
			sameAs: [COINMARKETCAP_URL],
			metadata: {
				pluginId: 'coinmarketcap',
				provider: 'coinmarketcap',
				platform: 'coinmarketcap',
			},
		});
	});

	for (const input of DECLINED_COINMARKETCAP_URLS) {
		it(`declines unsupported CoinMarketCap URL ${input}`, async () => {
			const engine = createServerEngine({
				onClassifierError: () => undefined,
				plugins: createDefaultTestPlugins(),
			});

			const result = await engine.classify({
				input,
				mode: 'progressive',
				classificationSessionId: `coinmarketcap-decline-${DECLINED_COINMARKETCAP_URLS.indexOf(input)}`,
			});

			expect(result.classification?.domain).toBe('web');
			expect(result.resolved?.resolverId).toBe('default-url-resolver');
			expect(result.resolved?.atoms[0]).toMatchObject({
				schemaType: 'WebSite',
				category: 'thing',
			});
			expect(
				result.resolved?.atoms.some((atom) => atom.canonicalId?.startsWith('coinmarketcap:'))
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
