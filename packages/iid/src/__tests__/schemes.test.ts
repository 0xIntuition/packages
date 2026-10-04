import { describe, expect, it } from 'vitest';
import type { WdEntitySchemaBinding, WdEntitySchemaSlug } from '../index.js';
import * as publicIid from '../index.js';
import { validateIntuitionId } from '../parse.js';
import { SCHEMES } from '../schemes.js';
import { derivePodcastGuid } from '../uuid5.js';

const {
	WD_ENTITYSCHEMA_BINDINGS,
	WD_ENTITYSCHEMA_SLUGS,
	isWdEntitySchemaSlug,
	isActiveWdEntitySchemaSlug,
} = publicIid;

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
	it('canonicalizes durable isni.org evidence and rejects wrong hosts and checksums', () => {
		expect(SCHEMES.isni.canonicalize('https://isni.org/isni/0000000121367029')).toBe(
			'0000000121367029'
		);
		expect(SCHEMES.isni.canonicalize('https://isni.org/isni/0000000121367020')).toBeUndefined();
		expect(SCHEMES.isni.canonicalize('https://isni.org/ISNI/0000000121367029')).toBe(
			'0000000121367029'
		);
		expect(SCHEMES.isni.canonicalize('https://example.org/isni/0000000121367029')).toBeUndefined();
		expect(SCHEMES.orcid.canonicalize('https://isni.org/isni/0000000121367029')).toBeUndefined();
	});
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

	it('keeps legacy Wikidata QIDs and entity URLs canonical', () => {
		expect(SCHEMES.wd.canonicalize('https://www.wikidata.org/wiki/Q42')).toBe('Q42');
		expect(SCHEMES.wd.canonicalize('q42')).toBe('Q42');
	});

	it('pins the ratified EntitySchema binding data', () => {
		expect(
			WD_ENTITYSCHEMA_BINDINGS.map(
				({ slug, entitySchemaId, anchorQids, classification, status, precedence, schemaRevId }) => [
					slug,
					entitySchemaId,
					anchorQids,
					classification,
					status,
					precedence,
					schemaRevId,
				]
			)
		).toEqual([
			['film', 'E11424', ['Q11424'], 'Movie', 'active', 0, 2403158147],
			['television-series', 'E17', ['Q5398426'], 'TVSeries', 'active', 1, 2525771900],
			['television-series-season', 'E18', ['Q3464665'], 'TVSeason', 'dormant', 2, 2525772131],
			['television-series-episode', 'E19', ['Q21191270'], 'TVEpisode', 'dormant', 3, 2279362550],
			['written-work', 'E35', ['Q47461344'], 'Book', 'dormant', 4, 2525775487],
			['human', 'E10', ['Q5'], 'Person', 'active', 5, 2499173058],
			['podcast', 'E418', ['Q24634210'], 'PodcastSeries', 'dormant', 6, 2052853948],
			['podcast-episode', 'E420', ['Q61855877'], 'PodcastEpisode', 'dormant', 7, 2212603393],
			['video-game', 'E272', ['Q7889'], 'VideoGame', 'dormant', 8, 2363080401],
			['album', 'E248', ['Q482994'], 'MusicAlbum', 'dormant', 9, 2226920960],
			['organization', 'E98', ['Q43229'], 'Organization', 'dormant', 10, 2392901167],
		]);
	});

	it('canonicalizes every active and dormant EntitySchema slug', () => {
		expect(WD_ENTITYSCHEMA_BINDINGS.map(({ precedence }) => precedence)).toEqual(
			WD_ENTITYSCHEMA_BINDINGS.map((_, index) => index)
		);
		expect([...WD_ENTITYSCHEMA_SLUGS]).toEqual(WD_ENTITYSCHEMA_BINDINGS.map(({ slug }) => slug));

		for (const { slug } of WD_ENTITYSCHEMA_BINDINGS) {
			const canonical = `${slug}:Q42`;
			expect(SCHEMES.wd.canonicalize(`${slug}:q42`), slug).toBe(canonical);
			expect(SCHEMES.wd.canonicalize(canonical), slug).toBe(canonical);
		}
	});

	it('distinguishes the active minting set from dormant parse-only slugs', () => {
		for (const { slug, status } of WD_ENTITYSCHEMA_BINDINGS) {
			expect(isActiveWdEntitySchemaSlug(slug), slug).toBe(status === 'active');
		}
	});

	it('rejects unknown Wikidata slugs and never infers one from URLs', () => {
		expect(SCHEMES.wd.canonicalize('bogus:Q1')).toBeUndefined();
		expect(SCHEMES.wd.canonicalize('https://www.wikidata.org/wiki/Q188035')).toBe('Q188035');
	});

	it('rejects non-ASCII Wikidata slugs before case folding', () => {
		expect(SCHEMES.wd.canonicalize('written-wor\u212a:Q42')).toBeUndefined();
		expect(SCHEMES.wd.canonicalize('WrItTeN-WoR\u212a:q42')).toBeUndefined();
	});

	it('keeps the ratified trim for every wd form: BOM and NBSP edges trim like whitespace (D-P16-4)', () => {
		expect(SCHEMES.wd.canonicalize(' \tfilm:q42\r\n')).toBe('film:Q42');
		expect(SCHEMES.wd.canonicalize('\uFEFFfilm:Q42\uFEFF')).toBe('film:Q42');
		expect(SCHEMES.wd.canonicalize('\uFEFFQ42\uFEFF')).toBe('Q42');
		expect(SCHEMES.wd.canonicalize('\u00A0Q42\u00A0')).toBe('Q42');
	});

	it('exports the typed-wd bindings, slug guards and public types', () => {
		const bindings: readonly WdEntitySchemaBinding[] = publicIid.WD_ENTITYSCHEMA_BINDINGS;
		const slugs: readonly WdEntitySchemaSlug[] = publicIid.WD_ENTITYSCHEMA_SLUGS;
		expect(bindings).toHaveLength(11);
		expect(slugs).toEqual(bindings.map(({ slug }) => slug));
		expect(isWdEntitySchemaSlug('film')).toBe(true);
		expect(isWdEntitySchemaSlug('written-work')).toBe(true);
		expect(isWdEntitySchemaSlug('bogus')).toBe(false);
		expect(isActiveWdEntitySchemaSlug('film')).toBe(true);
		expect(isActiveWdEntitySchemaSlug('written-work')).toBe(false);
	});

	it('does not expose a runtime-mutable Wikidata slug allowlist', () => {
		expect(Object.isFrozen(WD_ENTITYSCHEMA_SLUGS)).toBe(true);
		expect(() => {
			(WD_ENTITYSCHEMA_SLUGS as unknown as { add: (slug: string) => void }).add('bogus');
		}).toThrow(TypeError);
		expect(validateIntuitionId('int:wd:bogus:Q42')).toBe(false);
	});

	it('deep-freezes the binding table, its rows and their anchor QIDs', () => {
		expect(Object.isFrozen(WD_ENTITYSCHEMA_BINDINGS)).toBe(true);
		for (const row of WD_ENTITYSCHEMA_BINDINGS) {
			expect(Object.isFrozen(row), row.slug).toBe(true);
			expect(Object.isFrozen(row.anchorQids), row.slug).toBe(true);
		}
		const film = WD_ENTITYSCHEMA_BINDINGS[0] as unknown as {
			classification: string;
			anchorQids: { push: (qid: string) => void };
		};
		expect(() => {
			film.classification = 'Person';
		}).toThrow(TypeError);
		expect(() => {
			film.anchorQids.push('Q5');
		}).toThrow(TypeError);
		expect(WD_ENTITYSCHEMA_BINDINGS[0].classification).toBe('Movie');
		expect(WD_ENTITYSCHEMA_BINDINGS[0].anchorQids).toEqual(['Q11424']);
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

describe('music and podcast public exports', () => {
	it('exports the music identity policy and podcast feed normalizer', () => {
		expect(publicIid.MUSIC_IDENTITY_RUNG_POLICY).toEqual({
			artist: { schemaType: 'MusicGroup', rungs: ['isni', 'mbid:artist', 'wd', 'spotify:artist'] },
			'music-album': {
				schemaType: 'MusicAlbum',
				rungs: ['mbid:release-group', 'wd', 'spotify:album'],
			},
		});
		expect(publicIid.isPlainWdPrimaryAllowed('MusicGroup')).toBe(true);
		expect(publicIid.isPlainWdPrimaryAllowed('MusicAlbum')).toBe(true);
		expect(publicIid.isPlainWdPrimaryAllowed('Person')).toBe(false);
		expect(publicIid.normalizePodcastFeedUrl('HTTPS://Host.Example/Feed/')).toBe(
			'host.example/Feed'
		);
	});
});
