import { describe, expect, it } from 'vitest';
import { getClassification } from './classifications.js';

// Authored from reference 52056c5ce identity-ladders.ts; functions projected to train declarations.
const EXPECTED = [
	{
		slug: 'person',
		identity: {
			identifies: 'an individual human',
			ladder: [
				{
					kind: 'scheme',
					scheme: 'isni',
					source: {
						kind: 'same-as',
					},
				},
				{
					kind: 'scheme',
					scheme: 'wd',
					source: {
						kind: 'same-as',
					},
					wdSlug: 'human',
				},
				{
					kind: 'scheme',
					scheme: 'olid',
					source: {
						kind: 'same-as',
					},
				},
				{
					kind: 'gen1',
					tag: 4,
					recipe: [
						{
							key: 'givenName',
							from: 'field',
						},
						{
							key: 'familyName',
							from: 'field',
						},
					],
				},
				{
					kind: 'gen1',
					tag: 5,
					recipe: [
						{
							key: 'givenName',
							from: 'field',
						},
					],
				},
			],
		},
	},
	{
		slug: 'company',
		identity: {
			identifies: 'a legal entity',
			ladder: [
				{
					kind: 'scheme',
					scheme: 'wd',
					source: {
						kind: 'same-as',
					},
					wdSlug: 'organization',
				},
				{
					kind: 'scheme',
					scheme: 'url',
					source: {
						kind: 'field',
						key: 'url',
					},
				},
				{
					kind: 'gen1',
					tag: 4,
					recipe: [
						{
							key: 'name',
							from: 'field',
						},
					],
				},
			],
		},
	},
	{
		slug: 'brand',
		identity: {
			identifies: 'a brand/concept (instance businesses are local-business atoms)',
			ladder: [
				{
					kind: 'scheme',
					scheme: 'wd',
					source: {
						kind: 'same-as',
					},
				},
				{
					kind: 'gen1',
					tag: 2,
					recipe: [
						{
							key: 'name',
							from: 'field',
						},
					],
				},
			],
		},
	},
	{
		slug: 'local-business',
		identity: {
			identifies: 'one business at one place (instance level)',
			ladder: [
				{
					kind: 'scheme',
					scheme: 'wd',
					source: {
						kind: 'same-as',
					},
				},
				{
					kind: 'gen1',
					tag: 2,
					recipe: [
						{
							key: 'name',
							from: 'field',
						},
						{
							key: 'geo7',
							from: 'geohash',
							precision: 7,
						},
					],
				},
				{
					kind: 'gen1',
					tag: 4,
					recipe: [
						{
							key: 'name',
							from: 'field',
						},
					],
				},
			],
		},
	},
	{
		slug: 'location',
		identity: {
			identifies: 'a named place or coordinate point',
			ladder: [
				{
					kind: 'scheme',
					scheme: 'wd',
					source: {
						kind: 'same-as',
					},
				},
				{
					kind: 'scheme',
					scheme: 'geo',
					source: {
						kind: 'geohash',
						precision: 8,
					},
				},
				{
					kind: 'gen1',
					tag: 3,
					recipe: [
						{
							key: 'name',
							from: 'field',
						},
					],
				},
			],
		},
	},
	{
		slug: 'event',
		identity: {
			identifies: 'an event occurrence',
			ladder: [
				{
					kind: 'scheme',
					scheme: 'wd',
					source: {
						kind: 'same-as',
					},
				},
				{
					kind: 'scheme',
					scheme: 'url',
					source: {
						kind: 'same-as',
					},
				},
				{
					kind: 'gen1',
					tag: 3,
					recipe: [
						{
							key: 'name',
							from: 'field',
						},
						{
							key: 'startDate',
							from: 'field',
						},
					],
				},
				{
					kind: 'gen1',
					tag: 4,
					recipe: [
						{
							key: 'name',
							from: 'field',
						},
					],
				},
			],
		},
	},
	{
		slug: 'thing',
		identity: {
			identifies: 'anything not covered by a specific classification (weakest IDs by design)',
			ladder: [
				{
					kind: 'scheme',
					scheme: 'wd',
					source: {
						kind: 'same-as',
					},
				},
				{
					kind: 'scheme',
					scheme: 'url',
					source: {
						kind: 'same-as',
					},
				},
				{
					kind: 'gen1',
					tag: 3,
					recipe: [
						{
							key: 'name',
							from: 'field',
						},
					],
				},
			],
		},
	},
	{
		slug: 'book',
		identity: {
			identifies: 'the work; isbn identifies editions, bridged via equivalence',
			ladder: [
				{
					kind: 'scheme',
					scheme: 'isbn',
					source: {
						kind: 'field',
						key: 'isbn',
					},
				},
				{
					kind: 'scheme',
					scheme: 'olid',
					source: {
						kind: 'same-as',
					},
				},
				{
					kind: 'scheme',
					scheme: 'wd',
					source: {
						kind: 'same-as',
					},
					wdSlug: 'written-work',
				},
				{
					kind: 'gen1',
					tag: 3,
					recipe: [
						{
							key: 'name',
							from: 'field',
						},
					],
				},
			],
		},
	},
	{
		slug: 'article',
		identity: {
			identifies: 'an article',
			ladder: [
				{
					kind: 'scheme',
					scheme: 'doi',
					source: {
						kind: 'field',
						key: 'url',
					},
				},
				{
					kind: 'scheme',
					scheme: 'url',
					source: {
						kind: 'field',
						key: 'url',
					},
				},
				{
					kind: 'gen1',
					tag: 3,
					recipe: [
						{
							key: 'headline',
							from: 'field',
						},
					],
				},
			],
		},
	},
	{
		slug: 'news-article',
		identity: {
			identifies: 'a news story as published (URL-anchored)',
			ladder: [
				{
					kind: 'scheme',
					scheme: 'url',
					source: {
						kind: 'field',
						key: 'url',
					},
				},
				{
					kind: 'scheme',
					scheme: 'url',
					source: {
						kind: 'same-as',
					},
				},
				{
					kind: 'gen1',
					tag: 2,
					recipe: [
						{
							key: 'headline',
							from: 'field',
						},
						{
							key: 'datePublished',
							from: 'field',
						},
					],
				},
				{
					kind: 'gen1',
					tag: 3,
					recipe: [
						{
							key: 'headline',
							from: 'field',
						},
					],
				},
			],
		},
	},
	{
		slug: 'dataset',
		identity: {
			identifies: 'a dataset (version lineage out of ID scope)',
			ladder: [
				{
					kind: 'scheme',
					scheme: 'doi',
					source: {
						kind: 'same-as',
					},
				},
				{
					kind: 'scheme',
					scheme: 'url',
					source: {
						kind: 'field',
						key: 'url',
					},
				},
				{
					kind: 'gen1',
					tag: 3,
					recipe: [
						{
							key: 'name',
							from: 'field',
						},
					],
				},
			],
		},
	},
	{
		slug: 'defined-term',
		identity: {
			identifies: 'a term within a term set',
			ladder: [
				{
					kind: 'scheme',
					scheme: 'termset',
					source: {
						kind: 'derivation',
						name: 'termset-term',
					},
				},
				{
					kind: 'gen1',
					tag: 2,
					recipe: [
						{
							key: 'name',
							from: 'field',
						},
					],
				},
			],
		},
	},
	{
		slug: 'review',
		identity: {
			identifies: 'one review of one subject (relational entity)',
			ladder: [
				{
					kind: 'scheme',
					scheme: 'url',
					source: {
						kind: 'same-as',
					},
				},
			],
		},
	},
	{
		slug: 'comment',
		identity: {
			identifies: 'one comment on one subject (relational entity)',
			ladder: [
				{
					kind: 'scheme',
					scheme: 'url',
					source: {
						kind: 'same-as',
					},
				},
			],
		},
	},
	{
		slug: 'aggregate-rating',
		identity: null,
	},
	{
		slug: 'image',
		identity: {
			identifies: 'an image — byte-identity first; url is a mutable manifestation fallback (F4)',
			ladder: [
				{
					kind: 'scheme',
					scheme: 'hash',
					source: {
						kind: 'field',
						key: 'contentHash',
					},
				},
				{
					kind: 'scheme',
					scheme: 'url',
					source: {
						kind: 'field',
						key: 'url',
					},
				},
				{
					kind: 'gen1',
					tag: 3,
					recipe: [
						{
							key: 'name',
							from: 'field',
						},
					],
				},
			],
		},
	},
	{
		slug: 'video-object',
		identity: {
			identifies: 'a video — byte-identity first; platform URLs are manifestation fallbacks (F4)',
			ladder: [
				{
					kind: 'scheme',
					scheme: 'hash',
					source: {
						kind: 'field',
						key: 'contentHash',
					},
				},
				{
					kind: 'scheme',
					scheme: 'url',
					source: {
						kind: 'field',
						key: 'contentUrl',
					},
				},
				{
					kind: 'scheme',
					scheme: 'url',
					source: {
						kind: 'same-as',
					},
				},
				{
					kind: 'gen1',
					tag: 3,
					recipe: [
						{
							key: 'name',
							from: 'field',
						},
					],
				},
			],
		},
	},
	{
		slug: 'movie',
		identity: {
			identifies: 'a film (work level)',
			ladder: [
				{
					kind: 'scheme',
					scheme: 'wd',
					source: {
						kind: 'same-as',
					},
					wdSlug: 'film',
				},
				{
					kind: 'scheme',
					scheme: 'tmdb',
					source: {
						kind: 'same-as',
					},
				},
				{
					kind: 'scheme',
					scheme: 'imdb',
					source: {
						kind: 'same-as',
					},
				},
				{
					kind: 'gen1',
					tag: 4,
					recipe: [
						{
							key: 'name',
							from: 'field',
						},
						{
							key: 'yearPublished',
							from: 'year',
							of: 'datePublished',
						},
					],
				},
				{
					kind: 'gen1',
					tag: 5,
					recipe: [
						{
							key: 'name',
							from: 'field',
						},
					],
				},
			],
		},
	},
	{
		slug: 'tv-series',
		identity: {
			identifies: 'the series (seasons/episodes are unmodeled levels)',
			ladder: [
				{
					kind: 'scheme',
					scheme: 'wd',
					source: {
						kind: 'same-as',
					},
					wdSlug: 'television-series',
				},
				{
					kind: 'scheme',
					scheme: 'tmdb',
					source: {
						kind: 'same-as',
					},
				},
				{
					kind: 'scheme',
					scheme: 'imdb',
					source: {
						kind: 'same-as',
					},
				},
				{
					kind: 'gen1',
					tag: 4,
					recipe: [
						{
							key: 'name',
							from: 'field',
						},
						{
							key: 'startYear',
							from: 'year',
							of: 'startDate',
						},
					],
				},
				{
					kind: 'gen1',
					tag: 5,
					recipe: [
						{
							key: 'name',
							from: 'field',
						},
					],
				},
			],
		},
	},
	{
		slug: 'music-group',
		identity: {
			identifies: 'an artist/band public identity',
			ladder: [
				{
					kind: 'scheme',
					scheme: 'isni',
					source: {
						kind: 'same-as',
					},
				},
				{
					kind: 'scheme',
					scheme: 'mbid',
					source: {
						kind: 'same-as',
					},
				},
				{
					kind: 'scheme',
					scheme: 'wd',
					source: {
						kind: 'same-as',
					},
				},
				{
					kind: 'gen1',
					tag: 4,
					recipe: [
						{
							key: 'name',
							from: 'field',
						},
					],
				},
			],
		},
	},
	{
		slug: 'music-album',
		identity: {
			identifies: 'the release-group (the album as a work)',
			ladder: [
				{
					kind: 'scheme',
					scheme: 'mbid',
					source: {
						kind: 'same-as',
					},
				},
				{
					kind: 'scheme',
					scheme: 'wd',
					source: {
						kind: 'same-as',
					},
					wdSlug: 'album',
				},
				{
					kind: 'gen1',
					tag: 4,
					recipe: [
						{
							key: 'name',
							from: 'field',
						},
					],
				},
			],
		},
	},
	{
		slug: 'music-recording',
		identity: {
			identifies: 'the recording (isrc level; compositions are iswc territory)',
			ladder: [
				{
					kind: 'scheme',
					scheme: 'isrc',
					source: {
						kind: 'field',
						key: 'isrc',
					},
				},
				{
					kind: 'scheme',
					scheme: 'mbid',
					source: {
						kind: 'same-as',
					},
				},
				{
					kind: 'gen1',
					tag: 3,
					recipe: [
						{
							key: 'name',
							from: 'field',
						},
					],
				},
			],
		},
	},
	{
		slug: 'podcast-series',
		identity: {
			identifies: 'the show (feed level)',
			ladder: [
				{
					kind: 'scheme',
					scheme: 'podcastguid',
					source: {
						kind: 'field',
						key: 'podcastGuid',
					},
				},
				{
					kind: 'scheme',
					scheme: 'podcastguid',
					source: {
						kind: 'podcast-guid',
						key: 'feedUrl',
					},
				},
				{
					kind: 'scheme',
					scheme: 'url',
					source: {
						kind: 'field',
						key: 'url',
					},
				},
				{
					kind: 'gen1',
					tag: 3,
					recipe: [
						{
							key: 'name',
							from: 'field',
						},
					],
				},
			],
		},
	},
	{
		slug: 'podcast-episode',
		identity: {
			identifies:
				'one FEED ITEM (manifestation) — the episode-work is the equivalence cluster over feed items (D26)',
			ladder: [
				{
					kind: 'scheme',
					scheme: 'rssitem',
					source: {
						kind: 'derivation',
						name: 'rss-item',
					},
				},
				{
					kind: 'scheme',
					scheme: 'url',
					source: {
						kind: 'field',
						key: 'url',
					},
				},
				{
					kind: 'gen1',
					tag: 3,
					recipe: [
						{
							key: 'name',
							from: 'field',
						},
						{
							key: 'datePublished',
							from: 'field',
						},
					],
				},
				{
					kind: 'gen1',
					tag: 4,
					recipe: [
						{
							key: 'name',
							from: 'field',
						},
					],
				},
			],
		},
	},
	{
		slug: 'product',
		identity: {
			identifies: 'the product model (not individual units)',
			ladder: [
				{
					kind: 'scheme',
					scheme: 'gtin',
					source: {
						kind: 'field',
						key: 'gtin',
					},
				},
				{
					kind: 'gen1',
					tag: 2,
					recipe: [
						{
							key: 'name',
							from: 'field',
						},
					],
				},
			],
		},
	},
	{
		slug: 'service',
		identity: {
			identifies: 'a service offering',
			ladder: [
				{
					kind: 'scheme',
					scheme: 'url',
					source: {
						kind: 'same-as',
					},
				},
				{
					kind: 'gen1',
					tag: 2,
					recipe: [
						{
							key: 'name',
							from: 'field',
						},
					],
				},
			],
		},
	},
	{
		slug: 'web-page',
		identity: {
			identifies: 'a page at a canonical URL',
			ladder: [
				{
					kind: 'scheme',
					scheme: 'url',
					source: {
						kind: 'field',
						key: 'url',
					},
				},
			],
		},
	},
	{
		slug: 'web-site',
		identity: {
			identifies: 'a site (origin level)',
			ladder: [
				{
					kind: 'scheme',
					scheme: 'url',
					source: {
						kind: 'url-origin',
						key: 'url',
					},
				},
			],
		},
	},
	{
		slug: 'job-posting',
		identity: {
			identifies: 'one posting',
			ladder: [
				{
					kind: 'scheme',
					scheme: 'url',
					source: {
						kind: 'field',
						key: 'url',
					},
				},
				{
					kind: 'gen1',
					tag: 2,
					recipe: [
						{
							key: 'title',
							from: 'field',
						},
						{
							key: 'datePosted',
							from: 'field',
						},
					],
				},
				{
					kind: 'gen1',
					tag: 3,
					recipe: [
						{
							key: 'title',
							from: 'field',
						},
					],
				},
			],
		},
	},
	{
		slug: 'social-media-account',
		identity: {
			identifies: 'an account on a platform (the person behind it is a separate atom)',
			ladder: [
				{
					kind: 'scheme',
					scheme: 'acct',
					source: {
						kind: 'derivation',
						name: 'acct-strong',
					},
				},
				{
					kind: 'scheme',
					scheme: 'acct',
					source: {
						kind: 'derivation',
						name: 'acct-weak',
					},
				},
			],
		},
	},
	{
		slug: 'social-media-posting',
		identity: {
			identifies: 'one post',
			ladder: [
				{
					kind: 'scheme',
					scheme: 'url',
					source: {
						kind: 'field',
						key: 'url',
					},
				},
				{
					kind: 'gen1',
					tag: 2,
					recipe: [
						{
							key: 'textHash',
							from: 'text-hash',
							of: 'text',
						},
					],
				},
			],
		},
	},
	{
		slug: 'ethereum-account',
		identity: {
			identifies: 'an EOA/keypair (D24: fixed eip155:1)',
			ladder: [
				{
					kind: 'scheme',
					scheme: 'caip10',
					source: {
						kind: 'derivation',
						name: 'caip10-eoa',
					},
				},
			],
		},
	},
	{
		slug: 'ethereum-erc20',
		identity: {
			identifies: 'a token asset on a chain',
			ladder: [
				{
					kind: 'scheme',
					scheme: 'caip19',
					source: {
						kind: 'derivation',
						name: 'caip19-erc20',
					},
				},
			],
		},
	},
	{
		slug: 'ethereum-smart-contract',
		identity: {
			identifies: 'a deployed contract',
			ladder: [
				{
					kind: 'scheme',
					scheme: 'caip10',
					source: {
						kind: 'derivation',
						name: 'caip10-contract',
					},
				},
			],
		},
	},
	{
		slug: 'software',
		identity: {
			identifies:
				'the package/project, version-free — purl (open spec) first; repo URLs migrate (F5)',
			ladder: [
				{
					kind: 'scheme',
					scheme: 'purl',
					source: {
						kind: 'field',
						key: 'packageUrl',
					},
				},
				{
					kind: 'scheme',
					scheme: 'url',
					source: {
						kind: 'field',
						key: 'codeRepository',
					},
				},
				{
					kind: 'gen1',
					tag: 3,
					recipe: [
						{
							key: 'name',
							from: 'field',
						},
					],
				},
			],
		},
	},
	{
		slug: 'software-application',
		identity: {
			identifies: 'an end-user application',
			ladder: [
				{
					kind: 'scheme',
					scheme: 'url',
					source: {
						kind: 'field',
						key: 'url',
					},
				},
				{
					kind: 'gen1',
					tag: 4,
					recipe: [
						{
							key: 'name',
							from: 'field',
						},
					],
				},
			],
		},
	},
	{
		slug: 'mobile-application',
		identity: {
			identifies: 'a mobile app per store ecosystem',
			ladder: [
				{
					kind: 'scheme',
					scheme: 'appid',
					source: {
						kind: 'derivation',
						name: 'appid-bundle',
					},
				},
				{
					kind: 'scheme',
					scheme: 'url',
					source: {
						kind: 'field',
						key: 'downloadUrl',
					},
				},
				{
					kind: 'gen1',
					tag: 3,
					recipe: [
						{
							key: 'name',
							from: 'field',
						},
						{
							key: 'operatingSystem',
							from: 'field',
						},
					],
				},
			],
		},
	},
];

describe('complete declarative ladder parity', () => {
	for (const row of EXPECTED) {
		it(`${row.slug} preserves every source, recipe, and identity description`, () => {
			expect(getClassification(row.slug)?.identity).toEqual(row.identity);
		});
	}
});
