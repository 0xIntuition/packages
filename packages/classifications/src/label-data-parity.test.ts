import { describe, expect, it } from 'vitest';
import { getClassification } from './classifications.js';

// Authored from reference 52056c5ce generated specs; no runtime oracle imports.
const EXPECTED = [
	{
		slug: 'aggregate-rating',
		atomCategory: 'thing',
		commonName: null,
	},
	{
		slug: 'article',
		atomCategory: 'thing',
		commonName: null,
	},
	{
		slug: 'book',
		atomCategory: 'thing',
		commonName: null,
	},
	{
		slug: 'brand',
		atomCategory: 'company',
		commonName: null,
	},
	{
		slug: 'comment',
		atomCategory: 'thing',
		commonName: null,
	},
	{
		slug: 'company',
		atomCategory: 'company',
		commonName: null,
	},
	{
		slug: 'dataset',
		atomCategory: 'thing',
		commonName: null,
	},
	{
		slug: 'defined-term',
		atomCategory: 'thing',
		commonName: null,
	},
	{
		slug: 'ethereum-account',
		atomCategory: 'thing',
		commonName: null,
	},
	{
		slug: 'ethereum-erc20',
		atomCategory: 'thing',
		commonName: null,
	},
	{
		slug: 'ethereum-smart-contract',
		atomCategory: 'thing',
		commonName: null,
	},
	{
		slug: 'event',
		atomCategory: 'thing',
		commonName: null,
	},
	{
		slug: 'image',
		atomCategory: 'thing',
		commonName: null,
	},
	{
		slug: 'job-posting',
		atomCategory: 'thing',
		commonName: null,
	},
	{
		slug: 'local-business',
		atomCategory: 'place',
		commonName: null,
	},
	{
		slug: 'location',
		atomCategory: 'place',
		commonName: null,
	},
	{
		slug: 'mobile-application',
		atomCategory: 'software',
		commonName: null,
	},
	{
		slug: 'movie',
		atomCategory: 'thing',
		commonName: null,
	},
	{
		slug: 'music-album',
		atomCategory: 'song',
		commonName: null,
	},
	{
		slug: 'music-group',
		atomCategory: 'song',
		commonName: 'Artist/Band',
	},
	{
		slug: 'music-recording',
		atomCategory: 'song',
		commonName: 'Song',
	},
	{
		slug: 'news-article',
		atomCategory: 'thing',
		commonName: null,
	},
	{
		slug: 'person',
		atomCategory: 'person',
		commonName: null,
	},
	{
		slug: 'podcast-episode',
		atomCategory: 'podcast',
		commonName: null,
	},
	{
		slug: 'podcast-series',
		atomCategory: 'podcast',
		commonName: null,
	},
	{
		slug: 'product',
		atomCategory: 'product',
		commonName: null,
	},
	{
		slug: 'review',
		atomCategory: 'thing',
		commonName: null,
	},
	{
		slug: 'service',
		atomCategory: 'company',
		commonName: null,
	},
	{
		slug: 'social-media-account',
		atomCategory: 'person',
		commonName: null,
	},
	{
		slug: 'social-media-posting',
		atomCategory: 'thing',
		commonName: null,
	},
	{
		slug: 'software-application',
		atomCategory: 'software',
		commonName: null,
	},
	{
		slug: 'software',
		atomCategory: 'software',
		commonName: null,
	},
	{
		slug: 'thing',
		atomCategory: 'thing',
		commonName: null,
	},
	{
		slug: 'tv-series',
		atomCategory: 'thing',
		commonName: null,
	},
	{
		slug: 'video-object',
		atomCategory: 'thing',
		commonName: null,
	},
	{
		slug: 'web-page',
		atomCategory: 'thing',
		commonName: null,
	},
	{
		slug: 'web-site',
		atomCategory: 'thing',
		commonName: null,
	},
];

describe('complete label and engine category parity', () => {
	for (const row of EXPECTED) {
		it(`${row.slug} preserves the reference label and category`, () => {
			const spec = getClassification(row.slug);
			expect(Reflect.get(spec!, 'commonName') ?? null).toBe(row.commonName);
			expect(Reflect.get(spec!, 'atomCategory')).toBe(row.atomCategory);
		});
	}
});
