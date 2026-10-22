import { describe, expect, it } from 'vitest';

import { buildAtomDataObject, deriveClassificationIdentifier } from './atom-data.js';
import { CLASSIFICATION_SPECS, identityLadderFor } from './classifications.js';

const IDENTITY_LADDERS = Object.fromEntries(
	CLASSIFICATION_SPECS.map((spec) => [spec.slug, identityLadderFor(spec.slug) ?? null])
);

describe('identity ladder coverage', () => {
	it('declares a ladder entry (or an explicit null) for every classification', () => {
		for (const spec of CLASSIFICATION_SPECS) {
			expect(
				IDENTITY_LADDERS[spec.slug],
				`missing identity entry for "${spec.slug}"`
			).toBeDefined();
		}
	});

	it('has no ladder entries for unknown classifications', () => {
		const slugs = new Set(CLASSIFICATION_SPECS.map((spec) => spec.slug));

		for (const slug of Object.keys(IDENTITY_LADDERS)) {
			expect(slugs.has(slug), `ladder for unknown classification "${slug}"`).toBe(true);
		}
	});

	it('attaches the ladder to the frozen spec objects', () => {
		for (const spec of CLASSIFICATION_SPECS) {
			expect(spec.identity?.ladder ?? null).toBe(IDENTITY_LADDERS[spec.slug]?.rungs ?? null);
		}
	});

	it('keeps aggregate-rating outside IID scope (D23)', () => {
		expect(IDENTITY_LADDERS['aggregate-rating']).toBeNull();
	});

	it('never reuses a gen1 rung tag within a classification (D22)', () => {
		for (const ladder of Object.values(IDENTITY_LADDERS)) {
			if (!ladder) {
				continue;
			}

			const tags = ladder.rungs.filter((rung) => rung.kind === 'gen1').map((rung) => rung.tag);
			expect(new Set(tags).size).toBe(tags.length);
		}
	});
});

describe('deriveClassificationIdentifier', () => {
	it('derives Class A identifiers from registry fields (isbn, converted and validated)', () => {
		const derived = deriveClassificationIdentifier('book', {
			name: 'The Sovereign Individual',
			isbn: '0-684-83272-0',
		});

		expect(derived).toEqual({ iid: 'int:isbn:9780684832722', scheme: 'isbn', class: 'A' });
	});

	it('extracts Class A identifiers from sameAs URLs', () => {
		const derived = deriveClassificationIdentifier('music-group', {
			name: 'Daft Punk',
			sameAs: ['https://musicbrainz.org/artist/056e4f3e-d505-4dad-8ec1-d04f521cbb56'],
		});

		expect(derived?.iid).toBe('int:mbid:artist:056e4f3e-d505-4dad-8ec1-d04f521cbb56');
		expect(derived?.class).toBe('A');
	});

	it('falls back to gen1 golden vectors matching the spec examples', () => {
		expect(deriveClassificationIdentifier('music-group', { name: 'Daft Punk' })?.iid).toBe(
			'int:gen1:music-group:r4:364a1631a4fa913186c8b1db07729e6e'
		);
		expect(
			deriveClassificationIdentifier('person', { givenName: 'Douglas', familyName: 'Adams' })?.iid
		).toBe('int:gen1:person:r4:ecd9b23e74a6eb3380067d12349a669e');
	});

	it('supports mononym persons via the r5 rung (D25)', () => {
		const derived = deriveClassificationIdentifier('person', { givenName: 'Rihanna' });
		expect(derived?.tag).toBe(5);
		expect(derived?.iid.startsWith('int:gen1:person:r5:')).toBe(true);
	});

	it('derives person identity from OpenLibrary author URLs in sameAs (olid, D27 T2)', () => {
		const derived = deriveClassificationIdentifier('person', {
			givenName: 'Donna',
			sameAs: ['https://openlibrary.org/authors/OL443953A'],
		});

		expect(derived).toEqual({ iid: 'int:olid:OL443953A', scheme: 'olid', class: 'A' });
	});

	it('types a person Wikidata sameAs value ahead of the OLID rung', () => {
		const derived = deriveClassificationIdentifier('person', {
			sameAs: [
				'https://openlibrary.org/authors/OL443953A',
				'https://www.wikidata.org/wiki/Q233207',
			],
		});

		expect(derived?.iid).toBe('int:wd:human:Q233207');
	});

	it('emits active typed wd identifiers for the wave-1 classifications', () => {
		expect(
			deriveClassificationIdentifier('person', {
				sameAs: ['https://www.wikidata.org/wiki/Q42'],
			})?.iid
		).toBe('int:wd:human:Q42');
		expect(
			deriveClassificationIdentifier('movie', {
				sameAs: ['https://www.wikidata.org/wiki/Q25188'],
			})?.iid
		).toBe('int:wd:film:Q25188');
		expect(
			deriveClassificationIdentifier('tv-series', {
				sameAs: ['https://www.wikidata.org/wiki/Q1079'],
			})?.iid
		).toBe('int:wd:television-series:Q1079');
	});

	it('keeps dormant wd rungs non-minting and falls through the ladder', () => {
		expect(
			deriveClassificationIdentifier('book', {
				name: 'Matilda',
				sameAs: ['https://openlibrary.org/works/OL45883W', 'https://www.wikidata.org/wiki/Q174596'],
			})?.iid
		).toBe('int:olid:OL45883W');
		expect(
			deriveClassificationIdentifier('company', {
				name: 'Example Company',
				sameAs: ['https://www.wikidata.org/wiki/Q43229'],
				url: 'https://example.com',
			})?.scheme
		).toBe('url');
	});

	it('derives no identifier for ethereum-erc20 without a contract address (natives stay unminted)', () => {
		const derived = deriveClassificationIdentifier('ethereum-erc20', {
			chainId: 1,
			name: 'Ether',
			symbol: 'ETH',
			decimals: 18,
		});

		expect(derived).toBeUndefined();
	});

	it('derives geo-scoped local-business identifiers from coordinates', () => {
		const derived = deriveClassificationIdentifier('local-business', {
			name: 'Blue Bottle Coffee',
			latitude: 37.7823,
			longitude: -122.4076,
		});

		expect(derived?.iid).toBe('int:gen1:local-business:r2:3e0068d38f80d5f50f265019e8623f09');
	});

	it('derives chain identifiers with lowercased addresses', () => {
		const derived = deriveClassificationIdentifier('ethereum-erc20', {
			chainId: 1,
			address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
			name: 'USD Coin',
			symbol: 'USDC',
			decimals: 6,
		});

		expect(derived?.iid).toBe(
			'int:caip19:eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
		);
	});

	it('derives the podcast GUID offline from the feed URL', () => {
		const derived = deriveClassificationIdentifier('podcast-series', {
			name: 'The Example Show',
			feedUrl: 'https://feeds.example.com/the-example-show.xml',
		});

		expect(derived?.iid).toBe('int:podcastguid:f77016bc-fd74-5c94-893f-864deb06fc30');
	});

	it('prefers the declared podcast:guid tag over feed-URL derivation (D26)', () => {
		const derived = deriveClassificationIdentifier('podcast-series', {
			name: 'The Example Show',
			podcastGuid: '917393E3-1B1E-5CEF-ACE4-EDAA54E1F810',
			feedUrl: 'https://feeds.example.com/the-example-show.xml',
		});

		expect(derived?.iid).toBe('int:podcastguid:917393e3-1b1e-5cef-ace4-edaa54e1f810');
	});

	it('derives feed-scoped rssitem identifiers for podcast episodes (D26)', () => {
		const derived = deriveClassificationIdentifier('podcast-episode', {
			name: 'Episode 42: Determinism',
			feedGuid: 'f77016bc-fd74-5c94-893f-864deb06fc30',
			itemGuid: 'urn:example:ep42-2026-02-02',
		});

		expect(derived?.scheme).toBe('rssitem');
		expect(derived?.iid.startsWith('int:rssitem:f77016bc-fd74-5c94-893f-864deb06fc30:')).toBe(true);

		const premiumFeedItem = deriveClassificationIdentifier('podcast-episode', {
			name: 'Episode 42: Determinism',
			feedGuid: '917393e3-1b1e-5cef-ace4-edaa54e1f810',
			itemGuid: 'urn:example:ep42-2026-02-02',
		});

		// Different feeds of the same show yield different MANIFESTATION atoms;
		// the episode-work is their equivalence cluster (D26).
		expect(premiumFeedItem?.iid).not.toBe(derived?.iid);
	});

	it('selects sameAs values order-independently (D28, audit F1)', () => {
		const refs = [
			'https://musicbrainz.org/artist/056e4f3e-d505-4dad-8ec1-d04f521cbb56',
			'https://musicbrainz.org/artist/00000000-0000-4000-8000-000000000000',
		];

		const forward = deriveClassificationIdentifier('music-group', { name: 'X', sameAs: refs });
		const reversed = deriveClassificationIdentifier('music-group', {
			name: 'X',
			sameAs: [...refs].reverse(),
		});

		expect(forward?.iid).toBe(reversed?.iid);
		expect(forward?.iid).toBe('int:mbid:artist:00000000-0000-4000-8000-000000000000');
	});

	it('ranks tmdb (community) above imdb (closed) for movies (D27)', () => {
		const derived = deriveClassificationIdentifier('movie', {
			name: 'Inception',
			sameAs: [
				'https://www.imdb.com/title/tt1375666/',
				'https://www.themoviedb.org/movie/27205-inception',
			],
		});

		expect(derived?.iid).toBe('int:tmdb:movie:27205');
	});

	it('types a movie Wikidata sameAs value ahead of the IMDb rung', () => {
		const derived = deriveClassificationIdentifier('movie', {
			name: 'Inception',
			sameAs: ['https://www.imdb.com/title/tt1375666/', 'https://www.wikidata.org/wiki/Q25188'],
		});

		expect(derived?.iid).toBe('int:wd:film:Q25188');
	});

	it('extracts OpenLibrary work IDs for books (D27, audit F3)', () => {
		const derived = deriveClassificationIdentifier('book', {
			name: 'The Sovereign Individual',
			sameAs: ['https://openlibrary.org/works/OL2716871W'],
		});

		expect(derived?.iid).toBe('int:olid:OL2716871W');
	});

	it('prefers content hashes over URLs for images (audit F4)', () => {
		const digest = 'sha256:9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08';
		const derived = deriveClassificationIdentifier('image', {
			name: 'Cover Art',
			url: 'https://cdn.example.com/cover.jpg',
			contentHash: digest,
		});

		expect(derived?.iid).toBe(`int:hash:${digest}`);
	});

	it('prefers purl over repo URLs for software (audit F5)', () => {
		const derived = deriveClassificationIdentifier('software', {
			name: 'React',
			codeRepository: 'https://github.com/facebook/react',
			packageUrl: 'pkg:npm/react@18.2.0',
		});

		expect(derived?.iid).toBe('int:purl:npm/react');
	});

	it('returns undefined for out-of-scope classifications', () => {
		expect(
			deriveClassificationIdentifier('aggregate-rating', { ratingValue: 4.5, reviewCount: 10 })
		).toBeUndefined();
	});
});

describe('buildAtomDataObject identifier injection', () => {
	it('injects the identifier right after @type when opted in', () => {
		const data = buildAtomDataObject(
			'book',
			{ name: 'The Sovereign Individual', isbn: '9780684832722' },
			{ identifier: true }
		);

		expect(Object.keys(data).slice(0, 3)).toEqual(['@context', '@type', 'identifier']);
		expect(data.identifier).toBe('int:isbn:9780684832722');
	});

	it('is byte-deterministic across independent builds of the same facts', () => {
		const values = { name: 'Daft Punk' };
		const a = JSON.stringify(buildAtomDataObject('music-group', values, { identifier: true }));
		const b = JSON.stringify(
			buildAtomDataObject('music-group', { ...values }, { identifier: true })
		);
		expect(a).toBe(b);
	});

	it('omits the identifier when no rung fires', () => {
		const data = buildAtomDataObject('review', { reviewBody: 'Great.' }, { identifier: true });
		expect(data.identifier).toBeUndefined();
	});

	it('does not change atom data when not opted in', () => {
		const data = buildAtomDataObject('book', { name: 'The Sovereign Individual' });
		expect(data.identifier).toBeUndefined();
	});
});
