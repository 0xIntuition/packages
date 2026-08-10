import { describe, expect, it } from 'vitest';

import { SCHEMES } from '../schemes.js';
import { derivePodcastGuid } from '../uuid5.js';

describe('isbn', () => {
	it('converts valid ISBN-10 to ISBN-13', () => {
		expect(SCHEMES.isbn.canonicalize('0-684-83272-0')).toBe('9780684832722');
	});

	it('accepts hyphenated ISBN-13', () => {
		expect(SCHEMES.isbn.canonicalize('978-0-684-83272-2')).toBe('9780684832722');
	});

	it('rejects checksum failures (the invalid book.ts placeholder from the battle test)', () => {
		expect(SCHEMES.isbn.canonicalize('9780684832720')).toBeUndefined();
	});

	it('handles X check digits in ISBN-10', () => {
		expect(SCHEMES.isbn.canonicalize('097522980X')).toBe('9780975229804');
	});
});

describe('gtin', () => {
	it('zero-pads to GTIN-14', () => {
		expect(SCHEMES.gtin.canonicalize('036000291452')).toBe('00036000291452');
	});

	it('rejects bad check digits', () => {
		expect(SCHEMES.gtin.canonicalize('036000291453')).toBeUndefined();
	});
});

describe('check-digit identity schemes', () => {
	it('canonicalizes ISRC by stripping separators and uppercasing', () => {
		expect(SCHEMES.isrc.canonicalize('us-sm1-00-07459')).toBe('USSM10007459');
	});

	it('validates ORCID via ISO 7064 mod 11-2', () => {
		expect(SCHEMES.orcid.canonicalize('0000-0002-1825-0097')).toBe('0000000218250097');
		expect(SCHEMES.orcid.canonicalize('0000-0002-1825-0098')).toBeUndefined();
	});

	it('validates LEI via ISO 7064 mod 97-10', () => {
		expect(SCHEMES.lei.canonicalize('5493001KJTIIGC8Y1R12')).toBe('5493001KJTIIGC8Y1R12');
		expect(SCHEMES.lei.canonicalize('5493001KJTIIGC8Y1R13')).toBeUndefined();
	});
});

describe('doi / wd / mbid / imdb / tmdb', () => {
	it('strips DOI resolver prefixes and lowercases', () => {
		expect(SCHEMES.doi.canonicalize('https://doi.org/10.48550/ARXIV.1706.03762')).toBe(
			'10.48550/arxiv.1706.03762'
		);
	});

	it('extracts Wikidata QIDs from entity URLs', () => {
		expect(SCHEMES.wd.canonicalize('https://www.wikidata.org/wiki/Q42')).toBe('Q42');
		expect(SCHEMES.wd.canonicalize('q42')).toBe('Q42');
	});

	it('requires the MBID entity-type segment', () => {
		expect(
			SCHEMES.mbid.canonicalize(
				'https://musicbrainz.org/artist/056e4f3e-d505-4dad-8ec1-d04f521cbb56'
			)
		).toBe('artist:056e4f3e-d505-4dad-8ec1-d04f521cbb56');
		expect(SCHEMES.mbid.canonicalize('056e4f3e-d505-4dad-8ec1-d04f521cbb56')).toBeUndefined();
	});

	it('extracts IMDb ids from title URLs', () => {
		expect(SCHEMES.imdb.canonicalize('https://www.imdb.com/title/tt1375666/')).toBe('tt1375666');
	});

	it('canonicalizes TMDB type:id pairs and themoviedb.org URLs', () => {
		expect(SCHEMES.tmdb.canonicalize('movie/27205')).toBe('movie:27205');
		expect(SCHEMES.tmdb.canonicalize('https://www.themoviedb.org/movie/27205-inception')).toBe(
			'movie:27205'
		);
		expect(SCHEMES.tmdb.canonicalize('https://www.themoviedb.org/tv/1396')).toBe('tv:1396');
		expect(SCHEMES.tmdb.canonicalize('season:1')).toBeUndefined();
	});
});

describe('url (v0.2, D17)', () => {
	it('folds the battle-test variants to one canonical form', () => {
		const canonical = 'https://example.com/Articles?a=1&b=2';
		expect(
			SCHEMES.url.canonicalize('http://www.Example.com/Articles/?b=2&a=1&utm_source=news#top')
		).toBe(canonical);
		expect(SCHEMES.url.canonicalize('https://example.com/Articles?a=1&b=2')).toBe(canonical);
	});

	it('strips default ports and root trailing slash', () => {
		expect(SCHEMES.url.canonicalize('https://example.com:443/')).toBe('https://example.com');
	});

	it('strips si= share-tracking params (found live against a Spotify share link)', () => {
		expect(
			SCHEMES.url.canonicalize(
				'https://open.spotify.com/episode/3dVYvWrhLdKg5Znpn1YG9o?si=ca38623922614db1'
			)
		).toBe('https://open.spotify.com/episode/3dVYvWrhLdKg5Znpn1YG9o');
	});

	it('strips ad-platform click IDs and share/session tags (found live against Maps/Instagram links)', () => {
		expect(
			SCHEMES.url.canonicalize(
				'https://maps.google.com/?cid=9995273657061437338&g_mp=CidnbGUubWFwcw'
			)
		).toBe('https://maps.google.com?cid=9995273657061437338');
		expect(SCHEMES.url.canonicalize('https://www.instagram.com/p/xyz/?igshid=MzRlODBiNWFlZA')).toBe(
			'https://instagram.com/p/xyz'
		);
		expect(
			SCHEMES.url.canonicalize(
				'https://example.com/product?msclkid=abc&wbraid=def&spm=a2g0o.detail&color=red'
			)
		).toBe('https://example.com/product?color=red');
	});

	it('rejects non-http(s) URLs', () => {
		expect(SCHEMES.url.canonicalize('ftp://example.com/file')).toBeUndefined();
	});
});

describe('chain schemes', () => {
	it('lowercases EVM addresses in CAIP-10 (EIP-55 casing is presentation)', () => {
		expect(SCHEMES.caip10.canonicalize('eip155:1:0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045')).toBe(
			'eip155:1:0xd8da6bf26964af9d7eed9e03e53415d37aa96045'
		);
	});

	it('canonicalizes CAIP-19 asset ids', () => {
		expect(
			SCHEMES.caip19.canonicalize('eip155:1/erc20:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48')
		).toBe('eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48');
	});
});

describe('podcastguid', () => {
	it('derives the Podcasting 2.0 GUID offline from a feed URL', () => {
		expect(derivePodcastGuid('https://feeds.example.com/the-example-show.xml')).toBe(
			'f77016bc-fd74-5c94-893f-864deb06fc30'
		);
	});
});

describe('misc natural keys', () => {
	it('canonicalizes purl by dropping pkg: prefix and version', () => {
		expect(SCHEMES.purl.canonicalize('pkg:npm/react@18.2.0')).toBe('npm/react');
	});

	it('canonicalizes appid store + bundle', () => {
		expect(SCHEMES.appid.canonicalize('android:com.spotify.music')).toBe(
			'android:com.spotify.music'
		);
		expect(SCHEMES.appid.canonicalize('windows:com.foo')).toBeUndefined();
	});

	it('accepts strong and weak acct forms', () => {
		expect(SCHEMES.acct.canonicalize('x:295218901')).toBe('x:295218901');
		expect(SCHEMES.acct.canonicalize('github:@Torvalds')).toBe('github:@torvalds');
	});

	it('validates content hashes', () => {
		const digest = 'sha256:9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08';
		expect(SCHEMES.hash.canonicalize(digest.toUpperCase())).toBe(digest);
	});
});
