import { describe, expect, it } from 'bun:test';
import { createClientEngine } from '../src/client';
import { createServerEngine } from '../src/server';
import { createDefaultTestPlugins } from './helpers/default-plugins';

describe('@0xintuition/atom-classification scaffold', () => {
	it('returns placeholder result for client runtime', async () => {
		const engine = createClientEngine({
			onClassifierError: () => undefined,
			plugins: createDefaultTestPlugins(),
		});
		const result = await engine.classify({
			input: 'https://example.com',
			mode: 'client-only',
			classificationSessionId: 'test-session-client',
		});

		expect(result.ok).toBe(true);
		expect(result.status).toBe('complete');
		expect(result.contractVersion).toBe('cpkg-02');
		expect(result.runtime).toBe('client');
		expect(result.mode).toBe('client-only');
		expect(result.classificationSessionId).toBe('test-session-client');
		expect(result.policy.runServerEnrichment).toBe(false);
		expect(result.policy.requestedServerTiers).toEqual([]);
		expect(result.classification?.type).toBe('url');
		expect(result.classification?.domain).toBe('web');
		expect(result.resolved?.resolverId).toBe('default-url-resolver');
	});

	it('returns placeholder result for server runtime', async () => {
		const engine = createServerEngine({
			onClassifierError: () => undefined,
			plugins: createDefaultTestPlugins(),
		});
		const result = await engine.classify({
			input: 'ethereum:0x1111111111111111111111111111111111111111',
			mode: 'server-only',
			classificationSessionId: 'test-session-server',
		});

		expect(result.ok).toBe(true);
		expect(result.status).toBe('complete');
		expect(result.contractVersion).toBe('cpkg-02');
		expect(result.runtime).toBe('server');
		expect(result.mode).toBe('server-only');
		expect(result.classificationSessionId).toBe('test-session-server');
		expect(result.policy.runClientClassification).toBe(false);
		expect(result.policy.requestedServerTiers).toEqual([2, 3]);
		expect(result.classification?.domain).toBe('ethereum');
		expect(result.resolved?.resolverId).toBe('etherscan-resolver');
	});

	it('maps spotify tracks to MusicRecording in client-only deterministic fallback', async () => {
		const engine = createServerEngine({
			onClassifierError: () => undefined,
			plugins: createDefaultTestPlugins(),
		});
		const result = await engine.classify({
			input: 'https://open.spotify.com/track/0ojU4I7FDbtkvh4lnkPI1C?si=21240713411d486b',
			mode: 'client-only',
			classificationSessionId: 'test-session-spotify-client-only',
		});

		expect(result.classification?.domain).toBe('spotify');
		expect(result.classification?.subtype).toBe('track');
		expect(result.resolved?.resolverId).toBe('spotify-resolver');
		const atom = result.resolved?.atoms[0];
		expect(atom).toMatchObject({
			schemaType: 'MusicRecording',
			category: 'song',
			canonicalId: 'spotify:track:0ojU4I7FDbtkvh4lnkPI1C',
			sameAs: ['https://open.spotify.com/track/0ojU4I7FDbtkvh4lnkPI1C'],
			source: 'platform-v0:generic',
		});
		expect(atom?.data).toMatchObject({
			'@context': 'https://schema.org/',
			'@type': 'MusicRecording',
			name: 'Spotify Track 0ojU4I7FDbtkvh4lnkPI1C',
			sameAs: ['https://open.spotify.com/track/0ojU4I7FDbtkvh4lnkPI1C'],
		});
		expect(result.resolved?.classifications[0]?.type).toBe('MusicRecording');
		expect(result.resolved?.classifications[0]?.meta.pluginId).toBe('spotify');
		expect(atom?.metadata).toMatchObject({
			platform: 'spotify',
			subtype: 'track',
			fallbackStage: 'generic',
			fallbackChain: ['oembed', 'opengraph', 'generic'],
		});
	});

	it('prefers deterministic platform builtins over the default-url WebSite fallback', async () => {
		const fixtures = [
			{
				input: 'https://store.steampowered.com/app/570/Dota_2/',
				domain: 'steam',
				resolverId: 'steam-resolver',
				schemaType: 'VideoGame',
			},
			{
				input: 'https://openlibrary.org/books/OL7353617M/The_Hobbit',
				domain: 'openlibrary',
				resolverId: 'openlibrary-resolver',
				schemaType: 'Book',
			},
			{
				input: 'https://coingecko.com/en/coins/bitcoin',
				domain: 'coingecko',
				resolverId: 'coingecko-resolver',
				schemaType: 'Cryptocurrency',
			},
			{
				input: 'https://coinmarketcap.com/currencies/bitcoin/',
				domain: 'coinmarketcap',
				resolverId: 'coinmarketcap-resolver',
				schemaType: 'Cryptocurrency',
			},
			{
				input: 'https://www.etsy.com/listing/1234567890/handmade-blue-mug',
				domain: 'etsy',
				resolverId: 'etsy-resolver',
				schemaType: 'Product',
			},
			{
				input: 'https://acme-store.myshopify.com/products/handmade-blue-mug',
				domain: 'shopify',
				resolverId: 'shopify-resolver',
				schemaType: 'Product',
			},
		] as const;

		for (const fixture of fixtures) {
			const engine = createServerEngine({
				onClassifierError: () => undefined,
				plugins: createDefaultTestPlugins(),
			});
			const result = await engine.classify({
				input: fixture.input,
				mode: 'progressive',
				classificationSessionId: `builtin-over-default-${fixture.domain}`,
			});

			expect(result.classification?.domain).toBe(fixture.domain);
			expect(result.resolved?.resolverId).toBe(fixture.resolverId);
			expect(result.resolved?.atoms[0]?.schemaType).toBe(fixture.schemaType);
			expect(result.resolved?.atoms[0]?.schemaType).not.toBe('WebSite');
			expect(result.resolved?.atoms[0]?.metadata.pluginId).not.toBe('default-url');
		}
	});

	it('keeps crypto and marketplace identity URL-only when shared adapters are configured', async () => {
		let sharedAdapterCalls = 0;
		const engine = createServerEngine({
			onClassifierError: () => undefined,
			plugins: createDefaultTestPlugins({
				platformV0PluginOptions: {
					adapters: {
						openGraph: () => {
							sharedAdapterCalls += 1;
							return null;
						},
					},
				},
			}),
		});
		const fixtures = [
			['https://coingecko.com/en/coins/bitcoin', 'coingecko'],
			['https://coinmarketcap.com/currencies/bitcoin/', 'coinmarketcap'],
			['https://www.etsy.com/listing/1234567890/handmade-blue-mug', 'etsy'],
			['https://acme-store.myshopify.com/products/handmade-blue-mug', 'shopify'],
		] as const;

		for (const [input, domain] of fixtures) {
			const result = await engine.classify({
				input,
				mode: 'progressive',
				classificationSessionId: `url-only-${domain}`,
			});

			expect(result.classification?.domain).toBe(domain);
			expect(result.resolved?.atoms[0]?.metadata.fallbackStage).toBe('generic');
		}

		expect(sharedAdapterCalls).toBe(0);
	});
});
