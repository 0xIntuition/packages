import { describe, expect, it } from 'bun:test';
import { createDefaultUrlPlugin, createV0TypeProfilesPlugin } from '../src/plugins/index';
import { createServerEngine } from '../src/server';
import { createDefaultTestPlugins } from './helpers/default-plugins';

const COINGECKO_URLS = [
	'https://coingecko.com/en/coins/bitcoin',
	'https://www.coingecko.com/coins/bitcoin/',
] as const;

const DECLINED_COINGECKO_URLS = [
	'https://coingecko.com/en/exchanges/binance',
	'https://coingecko.com/en/nft/bored-ape-yacht-club',
	'https://coingecko.com/fr/coins/bitcoin',
	'https://evilcoingecko.com/en/coins/bitcoin',
	'https://coingecko.com.evil.com/en/coins/bitcoin',
] as const;

describe('coingecko platform plugin', () => {
	it('proves CoinGecko URLs fall through to WebSite/thing without the plugin', async () => {
		const engine = createServerEngine({
			onClassifierError: () => undefined,
			plugins: createDefaultUrlOnlyPlugins(),
		});

		const result = await engine.classify({
			input: COINGECKO_URLS[0],
			mode: 'progressive',
			classificationSessionId: 'coingecko-default-url-baseline',
		});

		expect(result.classification?.domain).toBe('web');
		expect(result.resolved?.resolverId).toBe('default-url-resolver');
		expect(result.resolved?.atoms[0]).toMatchObject({
			schemaType: 'WebSite',
			category: 'thing',
		});
	});

	for (const input of COINGECKO_URLS) {
		it(`classifies ${input} as a deterministic Cryptocurrency`, async () => {
			const engine = createServerEngine({
				onClassifierError: () => undefined,
				plugins: createDefaultTestPlugins(),
			});

			const result = await engine.classify({
				input,
				mode: 'progressive',
				classificationSessionId: `coingecko-${COINGECKO_URLS.indexOf(input)}`,
			});

			expect(result.classification).toMatchObject({
				domain: 'coingecko',
				subtype: 'coin',
				meta: {
					slug: 'bitcoin',
					canonicalUrl: 'https://coingecko.com/en/coins/bitcoin',
				},
			});
			expect(result.resolved?.resolverId).toBe('coingecko-resolver');
			expect(result.resolved?.atoms[0]).toMatchObject({
				schemaType: 'Cryptocurrency',
				category: 'thing',
				title: 'Bitcoin',
				canonicalId: 'coingecko:bitcoin',
				sameAs: ['https://coingecko.com/en/coins/bitcoin'],
				metadata: {
					pluginId: 'coingecko',
					provider: 'coingecko',
					platform: 'coingecko',
				},
			});
		});
	}

	for (const input of DECLINED_COINGECKO_URLS) {
		it(`declines unsupported CoinGecko URL ${input}`, async () => {
			const engine = createServerEngine({
				onClassifierError: () => undefined,
				plugins: createDefaultTestPlugins(),
			});

			const result = await engine.classify({
				input,
				mode: 'progressive',
				classificationSessionId: `coingecko-decline-${DECLINED_COINGECKO_URLS.indexOf(input)}`,
			});

			expect(result.classification?.domain).toBe('web');
			expect(result.resolved?.resolverId).toBe('default-url-resolver');
			expect(result.resolved?.atoms[0]).toMatchObject({
				schemaType: 'WebSite',
				category: 'thing',
			});
			expect(
				result.resolved?.atoms.some((atom) => atom.canonicalId?.startsWith('coingecko:'))
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
