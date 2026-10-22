import { describe, expect, it } from 'vitest';
import { CLASSIFICATION_SPECS } from './classifications.js';

// Authored from reference 52056c5ce. The oracle is inline; no runtime reference imports.
const EXPECTED = [
	{
		type: 'AggregateRating',
		slug: 'aggregate-rating',
		schema: {
			context: 'https://schema.org/',
			type: 'AggregateRating',
		},
		rungs: null,
	},
	{
		type: 'Article',
		slug: 'article',
		schema: {
			context: 'https://schema.org/',
			type: 'Article',
		},
		rungs: ['doi', 'url', 'gen1:r3'],
	},
	{
		type: 'Book',
		slug: 'book',
		schema: {
			context: 'https://schema.org/',
			type: 'Book',
		},
		rungs: ['isbn', 'olid', 'wd:written-work', 'gen1:r3'],
	},
	{
		type: 'Brand',
		slug: 'brand',
		schema: {
			context: 'https://schema.org/',
			type: 'Brand',
		},
		rungs: ['wd', 'gen1:r2'],
	},
	{
		type: 'Comment',
		slug: 'comment',
		schema: {
			context: 'https://schema.org/',
			type: 'Comment',
		},
		rungs: ['url'],
	},
	{
		type: 'Organization',
		slug: 'company',
		schema: {
			context: 'https://schema.org/',
			type: 'Organization',
		},
		rungs: ['wd:organization', 'url', 'gen1:r4'],
	},
	{
		type: 'Dataset',
		slug: 'dataset',
		schema: {
			context: 'https://schema.org/',
			type: 'Dataset',
		},
		rungs: ['doi', 'url', 'gen1:r3'],
	},
	{
		type: 'DefinedTerm',
		slug: 'defined-term',
		schema: {
			context: 'https://schema.org/',
			type: 'DefinedTerm',
		},
		rungs: ['termset', 'gen1:r2'],
	},
	{
		type: 'EthereumAccount',
		slug: 'ethereum-account',
		schema: {
			context: 'https://schemas.intuition.systems/v1',
			type: 'EthereumAccount',
		},
		rungs: ['caip10'],
	},
	{
		type: 'EthereumERC20',
		slug: 'ethereum-erc20',
		schema: {
			context: 'https://schemas.intuition.systems/v1',
			type: 'EthereumERC20',
		},
		rungs: ['caip19'],
	},
	{
		type: 'EthereumSmartContract',
		slug: 'ethereum-smart-contract',
		schema: {
			context: 'https://schemas.intuition.systems/v1',
			type: 'EthereumSmartContract',
		},
		rungs: ['caip10'],
	},
	{
		type: 'Event',
		slug: 'event',
		schema: {
			context: 'https://schema.org/',
			type: 'Event',
		},
		rungs: ['wd', 'url', 'gen1:r3', 'gen1:r4'],
	},
	{
		type: 'ImageObject',
		slug: 'image',
		schema: {
			context: 'https://schema.org/',
			type: 'ImageObject',
		},
		rungs: ['hash', 'url', 'gen1:r3'],
	},
	{
		type: 'JobPosting',
		slug: 'job-posting',
		schema: {
			context: 'https://schema.org/',
			type: 'JobPosting',
		},
		rungs: ['url', 'gen1:r2', 'gen1:r3'],
	},
	{
		type: 'LocalBusiness',
		slug: 'local-business',
		schema: {
			context: 'https://schema.org/',
			type: 'LocalBusiness',
		},
		rungs: ['wd', 'gen1:r2', 'gen1:r4'],
	},
	{
		type: 'Place',
		slug: 'location',
		schema: {
			context: 'https://schema.org/',
			type: 'Place',
		},
		rungs: ['wd', 'geo', 'gen1:r3'],
	},
	{
		type: 'MobileApplication',
		slug: 'mobile-application',
		schema: {
			context: 'https://schema.org/',
			type: 'MobileApplication',
		},
		rungs: ['appid', 'url', 'gen1:r3'],
	},
	{
		type: 'Movie',
		slug: 'movie',
		schema: {
			context: 'https://schema.org/',
			type: 'Movie',
		},
		rungs: ['wd:film', 'tmdb', 'imdb', 'gen1:r4', 'gen1:r5'],
	},
	{
		type: 'MusicAlbum',
		slug: 'music-album',
		schema: {
			context: 'https://schema.org/',
			type: 'MusicAlbum',
		},
		rungs: ['mbid', 'wd:album', 'gen1:r4'],
	},
	{
		type: 'MusicGroup',
		slug: 'music-group',
		schema: {
			context: 'https://schema.org/',
			type: 'MusicGroup',
		},
		rungs: ['isni', 'mbid', 'wd', 'gen1:r4'],
	},
	{
		type: 'MusicRecording',
		slug: 'music-recording',
		schema: {
			context: 'https://schema.org/',
			type: 'MusicRecording',
		},
		rungs: ['isrc', 'mbid', 'gen1:r3'],
	},
	{
		type: 'NewsArticle',
		slug: 'news-article',
		schema: {
			context: 'https://schema.org/',
			type: 'NewsArticle',
		},
		rungs: ['url', 'url', 'gen1:r2', 'gen1:r3'],
	},
	{
		type: 'Person',
		slug: 'person',
		schema: {
			context: 'https://schema.org/',
			type: 'Person',
		},
		rungs: ['isni', 'wd:human', 'olid', 'gen1:r4', 'gen1:r5'],
	},
	{
		type: 'PodcastEpisode',
		slug: 'podcast-episode',
		schema: {
			context: 'https://schema.org/',
			type: 'PodcastEpisode',
		},
		rungs: ['rssitem', 'url', 'gen1:r3', 'gen1:r4'],
	},
	{
		type: 'PodcastSeries',
		slug: 'podcast-series',
		schema: {
			context: 'https://schema.org/',
			type: 'PodcastSeries',
		},
		rungs: ['podcastguid', 'podcastguid', 'url', 'gen1:r3'],
	},
	{
		type: 'Product',
		slug: 'product',
		schema: {
			context: 'https://schema.org/',
			type: 'Product',
		},
		rungs: ['gtin', 'gen1:r2'],
	},
	{
		type: 'Review',
		slug: 'review',
		schema: {
			context: 'https://schema.org/',
			type: 'Review',
		},
		rungs: ['url'],
	},
	{
		type: 'Service',
		slug: 'service',
		schema: {
			context: 'https://schema.org/',
			type: 'Service',
		},
		rungs: ['url', 'gen1:r2'],
	},
	{
		type: 'SocialMediaAccount',
		slug: 'social-media-account',
		schema: {
			context: 'https://schema.org/',
			type: 'SocialMediaAccount',
		},
		rungs: ['acct', 'acct'],
	},
	{
		type: 'SocialMediaPosting',
		slug: 'social-media-posting',
		schema: {
			context: 'https://schema.org/',
			type: 'SocialMediaPosting',
		},
		rungs: ['url', 'gen1:r2'],
	},
	{
		type: 'SoftwareSourceCode',
		slug: 'software',
		schema: {
			context: 'https://schema.org/',
			type: 'SoftwareSourceCode',
		},
		rungs: ['purl', 'url', 'gen1:r3'],
	},
	{
		type: 'SoftwareApplication',
		slug: 'software-application',
		schema: {
			context: 'https://schema.org/',
			type: 'SoftwareApplication',
		},
		rungs: ['url', 'gen1:r4'],
	},
	{
		type: 'Thing',
		slug: 'thing',
		schema: {
			context: 'https://schema.org/',
			type: 'Thing',
		},
		rungs: ['wd', 'url', 'gen1:r3'],
	},
	{
		type: 'TVSeries',
		slug: 'tv-series',
		schema: {
			context: 'https://schema.org/',
			type: 'TVSeries',
		},
		rungs: ['wd:television-series', 'tmdb', 'imdb', 'gen1:r4', 'gen1:r5'],
	},
	{
		type: 'VideoObject',
		slug: 'video-object',
		schema: {
			context: 'https://schema.org/',
			type: 'VideoObject',
		},
		rungs: ['hash', 'url', 'url', 'gen1:r3'],
	},
	{
		type: 'WebPage',
		slug: 'web-page',
		schema: {
			context: 'https://schema.org/',
			type: 'WebPage',
		},
		rungs: ['url'],
	},
	{
		type: 'WebSite',
		slug: 'web-site',
		schema: {
			context: 'https://schema.org/',
			type: 'WebSite',
		},
		rungs: ['url'],
	},
] as const;

describe('reference catalogue parity', () => {
	it('defines every reference classification type', () => {
		expect(CLASSIFICATION_SPECS.map((spec) => spec.type).sort()).toEqual(
			EXPECTED.map((spec) => spec.type).sort()
		);
	});
	for (const expected of EXPECTED) {
		it(`${expected.slug} preserves reference rung order and wd slugs`, () => {
			const spec = CLASSIFICATION_SPECS.find((spec) => spec.type === expected.type);
			expect(spec).toBeDefined();
			expect(
				spec?.identity?.ladder.map((rung) =>
					rung.kind === 'gen1'
						? `gen1:r${rung.tag}`
						: rung.scheme + (rung.wdSlug ? `:${rung.wdSlug}` : '')
				) ?? null
			).toEqual(expected.rungs);
		});
		it(`${expected.slug} preserves reference schema context and type`, () => {
			expect(CLASSIFICATION_SPECS.find((spec) => spec.type === expected.type)?.schema).toEqual(
				expected.schema
			);
		});
	}
});
