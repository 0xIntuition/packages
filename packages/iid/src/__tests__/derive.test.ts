import { describe, expect, it } from 'vitest';

import { deriveIntuitionId } from '../derive.js';
import { keccak16 } from '../hash.js';
import { norm1 } from '../norm.js';
import { isAnchorEligible, parseIntuitionId, validateIntuitionId } from '../parse.js';
import type { IdentityLadder } from '../types.js';
import { derivePodcastGuid } from '../uuid5.js';

const bookLadder: IdentityLadder = {
	slug: 'book',
	identifies: 'the work',
	rungs: [
		{ kind: 'scheme', scheme: 'isbn', source: { kind: 'field', key: 'isbn' } },
		{ kind: 'gen1', tag: 3, recipe: [{ key: 'name', from: 'field' }] },
	],
};

const typedWdLadder: IdentityLadder = {
	slug: 'movie',
	identifies: 'a film',
	rungs: [
		{ kind: 'scheme', scheme: 'wd', wdSlug: 'film', source: { kind: 'field', key: 'wikidataId' } },
	],
};

const typedWdArrayLadder: IdentityLadder = {
	slug: 'movie',
	identifies: 'a film',
	rungs: [
		{
			kind: 'scheme',
			scheme: 'wd',
			wdSlug: 'film',
			source: { kind: 'same-as' },
		},
	],
};

const bareWdLadder: IdentityLadder = {
	slug: 'movie',
	identifies: 'a film',
	rungs: [{ kind: 'scheme', scheme: 'wd', source: { kind: 'field', key: 'wikidataId' } }],
};

const bareWdSameAsLadder: IdentityLadder = {
	slug: 'movie',
	identifies: 'a film',
	rungs: [{ kind: 'scheme', scheme: 'wd', source: { kind: 'same-as' } }],
};

const dormantWdLadder: IdentityLadder = {
	slug: 'book',
	identifies: 'a written work',
	rungs: [
		{
			kind: 'scheme',
			scheme: 'wd',
			wdSlug: 'written-work',
			source: { kind: 'field', key: 'wikidataId' },
		},
	],
};

describe('deriveIntuitionId (declarative engine)', () => {
	it('mints a typed wd value when a synthetic ladder supplies a slug', () => {
		expect(deriveIntuitionId(typedWdLadder, { wikidataId: 'q188035' })).toEqual({
			iid: 'int:wd:film:Q188035',
			scheme: 'wd',
			class: 'A',
		});
	});

	it('canonicalizes a typed wd raw value before prepending its slug', () => {
		for (const wikidataId of ['https://www.wikidata.org/wiki/Q188035', ' \tq188035 \n']) {
			expect(deriveIntuitionId(typedWdLadder, { wikidataId }), wikidataId).toEqual({
				iid: 'int:wd:film:Q188035',
				scheme: 'wd',
				class: 'A',
			});
		}
	});

	it('prefixes a bare-canonicalizable wd value returned by same-as', () => {
		expect(
			deriveIntuitionId(typedWdArrayLadder, {
				sameAs: ['https://www.wikidata.org/wiki/Q188035'],
			})
		).toEqual({ iid: 'int:wd:film:Q188035', scheme: 'wd', class: 'A' });
	});

	it('keeps an already-typed same-slug wd value idempotent through same-as', () => {
		expect(deriveIntuitionId(typedWdArrayLadder, { sameAs: ['film:Q188035'] })).toEqual({
			iid: 'int:wd:film:Q188035',
			scheme: 'wd',
			class: 'A',
		});
	});

	it('rejects an already-typed different-slug wd value returned by same-as', () => {
		expect(deriveIntuitionId(typedWdArrayLadder, { sameAs: ['human:Q188035'] })).toBeUndefined();
	});

	it('refuses a typed wd IID that exceeds the parser value limit', () => {
		const overlongQid = `Q${'1'.repeat(215)}`;
		expect(deriveIntuitionId(typedWdLadder, { wikidataId: overlongQid })).toBeUndefined();
	});

	it('never derives dormant-slug wd values', () => {
		expect(deriveIntuitionId(dormantWdLadder, { wikidataId: 'Q47461344' })).toBeUndefined();
	});

	it('legacy: a slugless wd rung still mints bare (D-P16-1, flips with the classifications lane)', () => {
		expect(deriveIntuitionId(bareWdLadder, { wikidataId: 'Q188035' })).toEqual({
			iid: 'int:wd:Q188035',
			scheme: 'wd',
			class: 'A',
		});
	});

	it('legacy: BOM- and NBSP-wrapped bare QIDs keep minting through slugless rungs (D-P16-4)', () => {
		for (const wikidataId of ['\uFEFFQ188035\uFEFF', '\u00A0Q188035\u00A0']) {
			expect(deriveIntuitionId(bareWdLadder, { wikidataId })?.iid, JSON.stringify(wikidataId)).toBe(
				'int:wd:Q188035'
			);
		}
		expect(deriveIntuitionId(bareWdSameAsLadder, { sameAs: ['\uFEFFQ42\uFEFF', 'Q9'] })?.iid).toBe(
			'int:wd:Q42'
		);
	});

	it('legacy: a slugless wd rung mints bare values only; typed values need a declared active slug (D-P16-5)', () => {
		for (const wikidataId of ['written-work:Q47461344', 'human:Q42', 'film:Q188035']) {
			expect(deriveIntuitionId(bareWdLadder, { wikidataId }), wikidataId).toBeUndefined();
		}
		expect(
			deriveIntuitionId(bareWdSameAsLadder, { sameAs: ['written-work:Q47461344'] })
		).toBeUndefined();
		expect(deriveIntuitionId(bareWdSameAsLadder, { sameAs: ['human:Q42'] })).toBeUndefined();
		expect(deriveIntuitionId(bareWdSameAsLadder, { sameAs: ['human:Q42', 'Q7'] })?.iid).toBe(
			'int:wd:Q7'
		);
	});

	it('selects the smallest canonical same-as value before matching the rung slug', () => {
		for (const sameAs of [
			['film:Q1', 'https://www.wikidata.org/wiki/Q42', 'Q42', 42, 'bogus:Q1'],
			['bogus:Q1', 42, 'Q42', 'https://www.wikidata.org/wiki/Q42', 'film:Q1'],
		]) {
			expect(deriveIntuitionId(typedWdArrayLadder, { sameAs })?.iid).toBe('int:wd:film:Q42');
		}
		for (const sameAs of [
			['human:Q1', 'album:Q1'],
			['album:Q1', 'human:Q1'],
		]) {
			expect(deriveIntuitionId(typedWdArrayLadder, { sameAs })).toBeUndefined();
		}
	});

	it('accepts the 220-character typed value boundary and falls through rejected typed rungs', () => {
		const boundaryQid = `Q${'1'.repeat(214)}`;
		expect(deriveIntuitionId(typedWdLadder, { wikidataId: boundaryQid })?.iid).toBe(
			`int:wd:film:${boundaryQid}`
		);
		for (const wikidataId of ['human:Q42', `Q${'1'.repeat(215)}`, 'bogus:Q1']) {
			const ladder: IdentityLadder = {
				...typedWdLadder,
				rungs: [...typedWdLadder.rungs, ...bookLadder.rungs],
			};
			expect(deriveIntuitionId(ladder, { wikidataId, isbn: '9780684832722' })?.iid).toBe(
				'int:isbn:9780684832722'
			);
		}
	});

	it('uses the highest rung with available data', () => {
		const derived = deriveIntuitionId(bookLadder, {
			name: 'The Sovereign Individual',
			isbn: '0-684-83272-0',
		});

		expect(derived).toEqual({
			iid: 'int:isbn:9780684832722',
			scheme: 'isbn',
			class: 'A',
		});
	});

	it('falls through invalid scheme values to lower rungs', () => {
		const derived = deriveIntuitionId(bookLadder, {
			name: 'The Sovereign Individual',
			isbn: '9780684832720', // invalid checksum
		});

		expect(derived?.iid).toBe('int:gen1:book:r3:59a02a73cbe0d2a4223719fdc4d006ab');
		expect(derived?.class).toBe('C');
		expect(derived?.tag).toBe(3);
	});

	it('returns undefined when no rung fires', () => {
		expect(deriveIntuitionId(bookLadder, {})).toBeUndefined();
	});

	it('treats gen1 recipes as all-or-nothing (spec §5.2)', () => {
		const ladder: IdentityLadder = {
			slug: 'movie',
			identifies: 'a film',
			rungs: [
				{
					kind: 'gen1',
					tag: 4,
					recipe: [
						{ key: 'name', from: 'field' },
						{ key: 'yearPublished', from: 'field' },
					],
				},
				{ kind: 'gen1', tag: 5, recipe: [{ key: 'name', from: 'field' }] },
			],
		};

		const partial = deriveIntuitionId(ladder, { name: 'Inception' });
		expect(partial?.tag).toBe(5);

		const complete = deriveIntuitionId(ladder, { name: 'Inception', yearPublished: '2010' });
		expect(complete?.iid).toBe('int:gen1:movie:r4:fb681afe7d438cad73ae90a70f1cc55a');
	});

	it('same-as selection is a pure function of the set, not the sequence', () => {
		const ladder: IdentityLadder = {
			slug: 'movie',
			identifies: 'a film',
			rungs: [{ kind: 'scheme', scheme: 'wd', source: { kind: 'same-as' } }],
		};

		const forward = deriveIntuitionId(ladder, {
			sameAs: ['https://www.wikidata.org/wiki/Q25188', 'https://www.wikidata.org/wiki/Q42'],
		});
		const reversed = deriveIntuitionId(ladder, {
			sameAs: ['https://www.wikidata.org/wiki/Q42', 'https://www.wikidata.org/wiki/Q25188'],
		});

		expect(forward?.iid).toBe(reversed?.iid);
		expect(forward?.iid).toBe('int:wd:Q25188'); // lexicographically smallest canonical
	});

	it('same-as entries that do not canonicalize are ignored', () => {
		const ladder: IdentityLadder = {
			slug: 'movie',
			identifies: 'a film',
			rungs: [{ kind: 'scheme', scheme: 'wd', source: { kind: 'same-as' } }],
		};

		const derived = deriveIntuitionId(ladder, {
			sameAs: ['https://www.imdb.com/title/tt1375666/', 'https://www.wikidata.org/wiki/Q25188'],
		});

		expect(derived?.iid).toBe('int:wd:Q25188');
	});

	it('url-origin reduces a page URL to its origin', () => {
		const ladder: IdentityLadder = {
			slug: 'website',
			identifies: 'a web property',
			rungs: [{ kind: 'scheme', scheme: 'url', source: { kind: 'url-origin', key: 'url' } }],
		};

		const derived = deriveIntuitionId(ladder, {
			url: 'https://www.example.com/some/deep/page?q=1',
		});

		expect(derived?.iid).toBe('int:url:https://example.com');
	});

	it('geohash source derives from latitude and longitude', () => {
		const ladder: IdentityLadder = {
			slug: 'place',
			identifies: 'a location cell',
			rungs: [{ kind: 'scheme', scheme: 'geo', source: { kind: 'geohash', precision: 8 } }],
		};

		const derived = deriveIntuitionId(ladder, { latitude: 37.7749, longitude: -122.4194 });
		expect(derived?.iid).toMatch(/^int:geo:[0123456789bcdefghjkmnpqrstuvwxyz]{8}$/);

		// Determinism across string/number coordinate representations.
		const fromStrings = deriveIntuitionId(ladder, { latitude: '37.7749', longitude: '-122.4194' });
		expect(fromStrings?.iid).toBe(derived?.iid);
	});

	it('podcast-guid derives the Podcasting 2.0 UUIDv5 from the feed URL', () => {
		const ladder: IdentityLadder = {
			slug: 'podcast-series',
			identifies: 'a feed',
			rungs: [
				{ kind: 'scheme', scheme: 'podcastguid', source: { kind: 'podcast-guid', key: 'feedUrl' } },
			],
		};

		const feedUrl = 'https://feeds.example.com/show/rss';
		const derived = deriveIntuitionId(ladder, { feedUrl });
		expect(derived?.iid).toBe(`int:podcastguid:${derivePodcastGuid(feedUrl)}`);
	});

	describe('named derivations', () => {
		it('acct-strong uses the immutable platform user id', () => {
			const ladder: IdentityLadder = {
				slug: 'social-media-account',
				identifies: 'an account',
				rungs: [
					{ kind: 'scheme', scheme: 'acct', source: { kind: 'derivation', name: 'acct-strong' } },
					{ kind: 'scheme', scheme: 'acct', source: { kind: 'derivation', name: 'acct-weak' } },
				],
			};

			const strong = deriveIntuitionId(ladder, {
				platform: 'x',
				platformUserId: '295218901',
				username: 'karpathy',
			});
			expect(strong?.iid).toBe('int:acct:x:295218901');

			const weak = deriveIntuitionId(ladder, { platform: 'x', username: '@Karpathy' });
			expect(weak?.iid).toBe('int:acct:x:@karpathy'); // NORM-1 handle, leading @ folded
		});

		it('appid-bundle combines store and bundle id', () => {
			const ladder: IdentityLadder = {
				slug: 'mobile-application',
				identifies: 'an app per store',
				rungs: [
					{ kind: 'scheme', scheme: 'appid', source: { kind: 'derivation', name: 'appid-bundle' } },
				],
			};

			const derived = deriveIntuitionId(ladder, {
				operatingSystem: 'iOS',
				bundleId: 'com.Spotify.Client',
			});
			expect(derived?.iid).toBe('int:appid:ios:com.spotify.client');
		});

		it('rss-item hashes the item guid within its feed', () => {
			const ladder: IdentityLadder = {
				slug: 'podcast-episode',
				identifies: 'one feed item',
				rungs: [
					{ kind: 'scheme', scheme: 'rssitem', source: { kind: 'derivation', name: 'rss-item' } },
				],
			};

			const feedGuid = '917393e3-1b1e-5cef-ace4-edaa54e1f810';
			const itemGuid = 'https://example.com/episodes/42';
			const derived = deriveIntuitionId(ladder, { feedGuid, itemGuid });
			expect(derived?.iid).toBe(`int:rssitem:${feedGuid}:${keccak16(norm1(itemGuid))}`);
		});

		it('termset-term hashes the set and slugs the code', () => {
			const ladder: IdentityLadder = {
				slug: 'defined-term',
				identifies: 'a term within a set',
				rungs: [
					{
						kind: 'scheme',
						scheme: 'termset',
						source: { kind: 'derivation', name: 'termset-term' },
					},
				],
			};

			const derived = deriveIntuitionId(ladder, {
				inDefinedTermSet: 'Intuition Launch Predicates',
				termCode: 'Follow Entity',
			});
			expect(derived?.iid).toBe(
				`int:termset:${keccak16(norm1('Intuition Launch Predicates'))}:follow-entity`
			);
		});

		it('caip10-eoa is chain-agnostic; caip10-contract and caip19-erc20 are chain-scoped', () => {
			const address = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
			const lower = address.toLowerCase();

			const eoa = deriveIntuitionId(
				{
					slug: 'ethereum-account',
					identifies: 'an EOA',
					rungs: [
						{
							kind: 'scheme',
							scheme: 'caip10',
							source: { kind: 'derivation', name: 'caip10-eoa' },
						},
					],
				},
				{ address }
			);
			expect(eoa?.iid).toBe(`int:caip10:eip155:1:${lower}`);

			const contract = deriveIntuitionId(
				{
					slug: 'ethereum-smart-contract',
					identifies: 'a deployed contract',
					rungs: [
						{
							kind: 'scheme',
							scheme: 'caip10',
							source: { kind: 'derivation', name: 'caip10-contract' },
						},
					],
				},
				{ chainId: 8453, address }
			);
			expect(contract?.iid).toBe(`int:caip10:eip155:8453:${lower}`);

			const token = deriveIntuitionId(
				{
					slug: 'ethereum-erc20',
					identifies: 'a token asset',
					rungs: [
						{
							kind: 'scheme',
							scheme: 'caip19',
							source: { kind: 'derivation', name: 'caip19-erc20' },
						},
					],
				},
				{ chainId: '1', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' }
			);
			expect(token?.iid).toBe(
				'int:caip19:eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
			);
		});
	});

	describe('recipe field kinds', () => {
		it('year extracts YYYY from an ISO date', () => {
			const ladder: IdentityLadder = {
				slug: 'movie',
				identifies: 'a film',
				rungs: [
					{
						kind: 'gen1',
						tag: 4,
						recipe: [
							{ key: 'name', from: 'field' },
							{ key: 'yearPublished', from: 'year', of: 'datePublished' },
						],
					},
				],
			};

			const derived = deriveIntuitionId(ladder, {
				name: 'Inception',
				datePublished: '2010-07-16',
			});
			// Identical preimage to the {name, yearPublished: '2010'} golden vector.
			expect(derived?.iid).toBe('int:gen1:movie:r4:fb681afe7d438cad73ae90a70f1cc55a');
		});

		it('text-hash and geohash recipe fields resolve deterministically', () => {
			const ladder: IdentityLadder = {
				slug: 'local-business',
				identifies: 'premises',
				rungs: [
					{
						kind: 'gen1',
						tag: 2,
						recipe: [
							{ key: 'name', from: 'field' },
							{ key: 'cell', from: 'geohash', precision: 7 },
							{ key: 'street', from: 'text-hash', of: 'address' },
						],
					},
				],
			};

			const values = {
				name: 'Blue Bottle Coffee',
				latitude: 37.7763,
				longitude: -122.4232,
				address: '1 Ferry Building',
			};
			const first = deriveIntuitionId(ladder, values);
			const second = deriveIntuitionId(ladder, values);
			expect(first).toBeDefined();
			expect(first).toEqual(second);
			expect(first?.iid.startsWith('int:gen1:local-business:r2:')).toBe(true);
		});
	});

	it('derived identifiers are valid and anchor eligibility follows class/typing', () => {
		const isbn = deriveIntuitionId(bookLadder, { isbn: '9780684832722' });
		expect(isbn && validateIntuitionId(isbn.iid)).toBe(true);
		expect(isbn && isAnchorEligible(isbn.iid)).toBe(true);

		const gen1 = deriveIntuitionId(bookLadder, { name: 'Some Obscure Manuscript' });
		expect(gen1 && validateIntuitionId(gen1.iid)).toBe(true);
		expect(gen1 && isAnchorEligible(gen1.iid)).toBe(false); // Class C floors at P1
	});
});

describe('typed wd eligibility', () => {
	it('allows active typed wd while refusing legacy bare and dormant typed values', () => {
		expect(isAnchorEligible('int:wd:film:Q188035')).toBe(true);
		expect(isAnchorEligible('int:wd:television-series:Q137400033')).toBe(true);
		expect(isAnchorEligible('int:wd:human:Q42')).toBe(true);
		expect(isAnchorEligible('int:wd:Q165219')).toBe(false);
		expect(isAnchorEligible('int:wd:written-work:Q47461344')).toBe(false);
		expect(isAnchorEligible('int:wd:television-series-season:Q3464665')).toBe(false);
	});
});

describe('parse and validate', () => {
	it('splits on the first two colons only', () => {
		expect(
			parseIntuitionId('int:caip10:eip155:1:0xd8da6bf26964af9d7eed9e03e53415d37aa96045')
		).toEqual({
			scheme: 'caip10',
			value: 'eip155:1:0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
		});
	});

	it('rejects unknown schemes and malformed strings', () => {
		expect(parseIntuitionId('int:bogus:123')).toBeUndefined();
		expect(parseIntuitionId('isbn:9780684832722')).toBeUndefined();
	});

	it('validates canonical form byte-exactly', () => {
		expect(validateIntuitionId('int:isbn:9780684832722')).toBe(true);
		expect(validateIntuitionId('int:isbn:978-0-684-83272-2')).toBe(false);
		expect(validateIntuitionId('int:wd:film:Q42')).toBe(true);
		expect(validateIntuitionId('int:wd:film:q42')).toBe(false);
		expect(validateIntuitionId('int:wd:bogus:Q1')).toBe(false);
		expect(validateIntuitionId('int:wd:q42')).toBe(false);
		expect(validateIntuitionId('int:wd:Q42')).toBe(true);
		expect(validateIntuitionId('int:gen1:book:r3:59a02a73cbe0d2a4223719fdc4d006ab')).toBe(true);
	});

	it('parses typed and legacy wd values without changing the pinned bare form', () => {
		expect(parseIntuitionId('int:wd:film:Q188035')).toEqual({
			scheme: 'wd',
			value: 'film:Q188035',
		});
		expect(parseIntuitionId('int:wd:Q42')).toEqual({ scheme: 'wd', value: 'Q42' });
	});
});
