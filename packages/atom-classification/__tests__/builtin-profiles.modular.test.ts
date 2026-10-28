import { describe, expect, it } from 'bun:test';

import { createNonUrlV0Profiles, createPlatformV0Profiles } from '../src/plugins/index';
import type {
	ClassificationClientClassificationHint,
	ClassificationRequest,
	ClassificationRuntime,
} from '../src/types';

describe('builtin profile modularity', () => {
	it('keeps non-url classifier and resolver outputs colocated by profile', async () => {
		const profiles = createNonUrlV0Profiles();
		expect(profiles.map((profile) => profile.id)).toEqual([
			'ethereum',
			'isbn',
			'int',
			'lexical',
			'plain-text',
		]);

		const fixtures: Array<{
			profileId: string;
			request: ClassificationRequest;
			classification: ClassificationClientClassificationHint;
			expectedSchemaType: string;
			runtime?: ClassificationRuntime;
		}> = [
			{
				profileId: 'ethereum',
				request: {
					input: '0x1111111111111111111111111111111111111111',
					mode: 'progressive',
					inputIntent: 'generic',
					classificationSessionId: 'profile-ethereum',
				},
				classification: {
					type: 'address',
					domain: 'ethereum',
					subtype: 'account',
					confidence: 0.99,
					meta: {
						address: '0x1111111111111111111111111111111111111111',
					},
				},
				expectedSchemaType: 'EthereumAccount',
			},
			{
				profileId: 'isbn',
				// The default ISBN profile resolves through Open Library on the server (5 s budget);
				// this modularity check stays off the network by taking the client-runtime fallback.
				runtime: 'client' as const,
				request: {
					input: 'ISBN 9780306406157',
					mode: 'progressive',
					inputIntent: 'generic',
					classificationSessionId: 'profile-isbn',
				},
				classification: {
					type: 'identifier',
					domain: 'isbn',
					subtype: 'isbn-13',
					confidence: 0.98,
					meta: {
						normalizedIsbn: '9780306406157',
					},
				},
				expectedSchemaType: 'Book',
			},
			{
				profileId: 'int',
				request: {
					input: 'int:isrc:USQX91300108',
					mode: 'progressive',
					inputIntent: 'generic',
					classificationSessionId: 'profile-int',
				},
				classification: {
					type: 'identifier',
					domain: 'intuition',
					subtype: 'isrc',
					confidence: 1,
					meta: {
						scheme: 'isrc',
						value: 'USQX91300108',
						canonicalIid: 'int:isrc:USQX91300108',
					},
				},
				expectedSchemaType: 'MusicRecording',
			},
			{
				profileId: 'lexical',
				request: {
					input: 'semantic',
					mode: 'progressive',
					inputIntent: 'generic',
					classificationSessionId: 'profile-lexical',
				},
				classification: {
					type: 'text',
					domain: 'lexical',
					subtype: 'word',
					confidence: 0.71,
					meta: {
						tokenCount: 1,
						normalizedTerm: 'semantic',
					},
				},
				expectedSchemaType: 'DefinedTerm',
			},
			{
				profileId: 'plain-text',
				request: {
					input: 'semantic grounding',
					mode: 'progressive',
					inputIntent: 'generic',
					classificationSessionId: 'profile-plain-text',
				},
				classification: {
					type: 'text',
					domain: 'plain-text',
					subtype: 'phrase',
					confidence: 0.61,
					meta: {
						tokenCount: 2,
					},
				},
				expectedSchemaType: 'Thing',
			},
		];

		for (const fixture of fixtures) {
			const profile = profiles.find((entry) => entry.id === fixture.profileId);
			expect(profile).toBeDefined();
			if (!profile) {
				continue;
			}

			expect(profile.canResolve(fixture.classification, fixture.request)).toBe(true);
			const resolution = await Promise.resolve(
				profile.resolve({
					runtime: fixture.runtime ?? 'server',
					request: fixture.request,
					classification: fixture.classification,
					now: new Date().toISOString(),
				})
			);
			expect(resolution?.classifications?.[0]?.type ?? resolution?.atoms?.[0]?.schemaType).toBe(
				fixture.expectedSchemaType
			);
		}
	});

	it('defines per-domain generic output contracts for platform profiles', () => {
		const profiles = createPlatformV0Profiles();
		expect(profiles.map((profile) => profile.domain)).toEqual([
			'spotify',
			'amazon',
			'github',
			'goodreads',
			'letterboxd',
			'places',
			'npm',
			'x',
			'instagram',
			'tiktok',
			'youtube',
			'wikipedia',
			'wikidata',
			'imdb',
			'tmdb',
			'openlibrary',
			'steam',
			'coingecko',
			'coinmarketcap',
			'etsy',
			'shopify',
		]);

		const fixtures: Array<{
			domain: (typeof profiles)[number]['domain'];
			classification: ClassificationClientClassificationHint;
			expectedSchemaType: string;
		}> = [
			{
				domain: 'spotify',
				classification: {
					type: 'url',
					domain: 'spotify',
					subtype: 'track',
					confidence: 0.99,
					meta: {
						resourceId: '4iV5W9uYEdYUVa79Axb7Rh',
					},
				},
				expectedSchemaType: 'MusicRecording',
			},
			{
				domain: 'amazon',
				classification: {
					type: 'url',
					domain: 'amazon',
					subtype: 'product',
					confidence: 0.96,
					meta: {
						asin: 'B08N5WRWNW',
					},
				},
				expectedSchemaType: 'Product',
			},
			{
				domain: 'github',
				classification: {
					type: 'url',
					domain: 'github',
					subtype: 'repo',
					confidence: 0.99,
					meta: {
						owner: '0xIntuition',
						repo: 'intuition-v2',
					},
				},
				expectedSchemaType: 'SoftwareSourceCode',
			},
			{
				domain: 'letterboxd',
				classification: {
					type: 'url',
					domain: 'letterboxd',
					subtype: 'film',
					confidence: 0.99,
					meta: {
						slug: 'moonlight',
						canonicalUrl: 'https://letterboxd.com/film/moonlight/',
					},
				},
				expectedSchemaType: 'Movie',
			},
			{
				domain: 'npm',
				classification: {
					type: 'url',
					domain: 'npm',
					subtype: 'package',
					confidence: 0.99,
					meta: {
						packageName: 'hono',
						canonicalUrl: 'https://www.npmjs.com/package/hono',
					},
				},
				expectedSchemaType: 'SoftwareSourceCode',
			},
			{
				domain: 'x',
				classification: {
					type: 'url',
					domain: 'x',
					subtype: 'post',
					confidence: 0.98,
					meta: {
						handle: 'intuition',
						postId: '123',
					},
				},
				expectedSchemaType: 'SocialMediaPosting',
			},
			{
				domain: 'instagram',
				classification: {
					type: 'url',
					domain: 'instagram',
					subtype: 'video',
					confidence: 0.97,
					meta: {
						shortcode: 'C4f6h1M0abc',
					},
				},
				expectedSchemaType: 'VideoObject',
			},
			{
				domain: 'tiktok',
				classification: {
					type: 'url',
					domain: 'tiktok',
					subtype: 'video',
					confidence: 0.98,
					meta: {
						videoId: '7345678901234567890',
					},
				},
				expectedSchemaType: 'VideoObject',
			},
			{
				domain: 'youtube',
				classification: {
					type: 'url',
					domain: 'youtube',
					subtype: 'video',
					confidence: 0.99,
					meta: {
						videoId: 'dQw4w9WgXcQ',
					},
				},
				expectedSchemaType: 'VideoObject',
			},
			{
				domain: 'wikipedia',
				classification: {
					type: 'url',
					domain: 'wikipedia',
					subtype: 'article',
					confidence: 0.95,
					meta: {
						articleTitle: 'Notion (software)',
						inferredSchemaType: 'SoftwareApplication',
						inferredCategory: 'software',
					},
				},
				expectedSchemaType: 'SoftwareApplication',
			},
			{
				domain: 'wikidata',
				classification: {
					type: 'url',
					domain: 'wikidata',
					subtype: 'entity',
					confidence: 1,
					meta: {
						qid: 'Q751921',
						canonicalUrl: 'https://www.wikidata.org/wiki/Q751921',
					},
				},
				expectedSchemaType: 'Thing',
			},
			{
				domain: 'imdb',
				classification: {
					type: 'url',
					domain: 'imdb',
					subtype: 'title',
					confidence: 0.98,
					meta: {
						titleId: 'tt0133093',
					},
				},
				expectedSchemaType: 'Movie',
			},
			{
				domain: 'tmdb',
				classification: {
					type: 'url',
					domain: 'tmdb',
					subtype: 'tv',
					confidence: 0.99,
					meta: {
						mediaType: 'tv',
						tmdbId: '1396',
						canonicalUrl: 'https://www.themoviedb.org/tv/1396',
					},
				},
				expectedSchemaType: 'TVSeries',
			},
			{
				domain: 'openlibrary',
				classification: {
					type: 'url',
					domain: 'openlibrary',
					subtype: 'work',
					confidence: 0.99,
					meta: {
						workOlid: 'OL45804W',
						canonicalUrl: 'https://openlibrary.org/works/OL45804W',
					},
				},
				expectedSchemaType: 'Book',
			},
			{
				domain: 'steam',
				classification: {
					type: 'url',
					domain: 'steam',
					subtype: 'app',
					confidence: 0.99,
					meta: {
						appId: '570',
						canonicalUrl: 'https://store.steampowered.com/app/570/',
					},
				},
				expectedSchemaType: 'VideoGame',
			},
			{
				domain: 'coingecko',
				classification: {
					type: 'url',
					domain: 'coingecko',
					subtype: 'coin',
					confidence: 0.99,
					meta: {
						slug: 'bitcoin',
						canonicalUrl: 'https://coingecko.com/en/coins/bitcoin',
					},
				},
				expectedSchemaType: 'Cryptocurrency',
			},
			{
				domain: 'coinmarketcap',
				classification: {
					type: 'url',
					domain: 'coinmarketcap',
					subtype: 'currency',
					confidence: 0.99,
					meta: {
						slug: 'bitcoin',
						canonicalUrl: 'https://coinmarketcap.com/currencies/bitcoin/',
					},
				},
				expectedSchemaType: 'Cryptocurrency',
			},
			{
				domain: 'etsy',
				classification: {
					type: 'url',
					domain: 'etsy',
					subtype: 'listing',
					confidence: 0.99,
					meta: {
						listingId: '1234567890',
						canonicalUrl: 'https://www.etsy.com/listing/1234567890',
					},
				},
				expectedSchemaType: 'Product',
			},
			{
				domain: 'shopify',
				classification: {
					type: 'url',
					domain: 'shopify',
					subtype: 'product',
					confidence: 0.99,
					meta: {
						host: 'acme-store.myshopify.com',
						slug: 'handmade-blue-mug',
						canonicalUrl: 'https://acme-store.myshopify.com/products/handmade-blue-mug',
					},
				},
				expectedSchemaType: 'Product',
			},
		];

		for (const fixture of fixtures) {
			const profile = profiles.find((entry) => entry.domain === fixture.domain);
			expect(profile).toBeDefined();
			if (!profile) {
				continue;
			}

			const atom = profile.resolveGeneric({
				classification: fixture.classification,
				requestInput: `https://${fixture.domain}.com/resource`,
				canonicalUrl: `https://${fixture.domain}.com/resource`,
				now: new Date().toISOString(),
			});

			if (fixture.domain === 'imdb') {
				expect(atom).toBeNull();
				continue;
			}
			expect(atom?.schemaType).toBe(fixture.expectedSchemaType);
			expect(atom?.metadata?.platform).toBe(fixture.domain);
		}
	});
});
