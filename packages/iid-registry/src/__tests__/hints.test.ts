import { SCHEME_NAMES } from '@0xintuition/iid';
import { describe, expect, it } from 'vitest';

import { identifierHintsForIid } from '../hints.js';

describe('identifierHintsForIid', () => {
	it('emits the plain scheme key for simple Class A schemes', () => {
		expect(identifierHintsForIid('int:isrc:USUM71703861')).toEqual({ isrc: 'USUM71703861' });
		expect(identifierHintsForIid('int:doi:10.1000/xyz123')).toEqual({ doi: '10.1000/xyz123' });
		expect(identifierHintsForIid('int:imdb:tt0133093')).toEqual({ imdb: 'tt0133093' });
		expect(identifierHintsForIid('int:olid:OL45804W')).toEqual({ olid: 'OL45804W' });
	});

	it('canonicalizes before emitting (non-canonical input, canonical hints)', () => {
		expect(identifierHintsForIid('int:isbn:0-684-83272-0')).toEqual({ isbn: '9780684832722' });
		expect(identifierHintsForIid('int:olid:ol26320a')).toEqual({ olid: 'OL26320A' });
	});

	it('adds reader aliases for wikidata and tmdb', () => {
		expect(identifierHintsForIid('int:wd:Q42')).toEqual({ wd: 'Q42', wikidata: 'Q42' });
		expect(identifierHintsForIid('int:tmdb:movie:603')).toEqual({
			tmdb: 'movie:603',
			tmdbId: 'movie:603',
		});
	});

	it('splits mbid into bare uuid + entity type', () => {
		expect(identifierHintsForIid('int:mbid:artist:056e4f3e-d505-4dad-8ec1-d04f521cbb56')).toEqual({
			mbid: '056e4f3e-d505-4dad-8ec1-d04f521cbb56',
			musicbrainz: '056e4f3e-d505-4dad-8ec1-d04f521cbb56',
			mbidType: 'artist',
		});
	});

	it('decomposes eip155 CAIP values into chainId + address', () => {
		expect(
			identifierHintsForIid('int:caip19:eip155:1/erc20:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48')
		).toEqual({
			caip19: 'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
			chainId: '1',
			address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
		});
		expect(
			identifierHintsForIid('int:caip10:eip155:1:0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045')
		).toEqual({
			caip10: 'eip155:1:0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
			chainId: '1',
			address: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
		});
	});

	it('keeps non-eip155 CAIP values whole (no chain decomposition)', () => {
		expect(
			identifierHintsForIid(
				'int:caip19:solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/spl:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
			)
		).toEqual({
			caip19:
				'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/spl:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
		});
	});

	it('emits podcast keys with the reader-facing camelCase alias', () => {
		expect(identifierHintsForIid('int:podcastguid:917393e3-1b1e-5cef-ace4-edaa54e1f810')).toEqual({
			podcastguid: '917393e3-1b1e-5cef-ace4-edaa54e1f810',
			podcastGuid: '917393e3-1b1e-5cef-ace4-edaa54e1f810',
		});

		const feedGuid = '917393e3-1b1e-5cef-ace4-edaa54e1f810';
		const itemHash = 'a'.repeat(32);
		expect(identifierHintsForIid(`int:rssitem:${feedGuid}:${itemHash}`)).toEqual({
			rssitem: `${feedGuid}:${itemHash}`,
			podcastGuid: feedGuid,
		});
	});

	it('maps acct platforms to their platform-provider keys', () => {
		expect(identifierHintsForIid('int:acct:github:torvalds')).toEqual({
			acct: 'github:torvalds',
			'github-user': 'torvalds',
		});
		expect(identifierHintsForIid('int:acct:x:@jack')).toEqual({
			acct: 'x:@jack',
			'x-handle': 'jack',
		});
		expect(identifierHintsForIid('int:acct:farcaster:dwr')).toEqual({ acct: 'farcaster:dwr' });
	});

	it('maps purl types to registry keys', () => {
		expect(identifierHintsForIid('int:purl:npm/left-pad')).toEqual({
			purl: 'npm/left-pad',
			npm: 'left-pad',
		});
		expect(identifierHintsForIid('int:purl:github/0xintuition/packages')).toEqual({
			purl: 'github/0xintuition/packages',
			'github-repo': '0xintuition/packages',
		});
		expect(identifierHintsForIid('int:purl:cargo/serde')).toEqual({ purl: 'cargo/serde' });
	});

	it('returns an empty map for malformed or uncanonicalizable input', () => {
		expect(identifierHintsForIid('int:isrc:nope')).toEqual({});
		expect(identifierHintsForIid('not an iid')).toEqual({});
		expect(identifierHintsForIid('')).toEqual({});
	});

	it('is total: every registered scheme yields non-empty hints for a canonical value', () => {
		const samples: Record<(typeof SCHEME_NAMES)[number], string> = {
			isbn: 'int:isbn:9780684832722',
			isrc: 'int:isrc:USUM71703861',
			iswc: 'int:iswc:T0345246801',
			isni: 'int:isni:000000012146438X',
			orcid: 'int:orcid:0000000218250097',
			lei: 'int:lei:HWUPKR0MPOU8FGXBT394',
			gtin: 'int:gtin:00012345678905',
			doi: 'int:doi:10.1000/xyz123',
			eidr: 'int:eidr:10.5240/7791-8534-2C23-9030-8610-5',
			wd: 'int:wd:Q42',
			mbid: 'int:mbid:artist:056e4f3e-d505-4dad-8ec1-d04f521cbb56',
			olid: 'int:olid:OL45804W',
			imdb: 'int:imdb:tt0133093',
			tmdb: 'int:tmdb:movie:603',
			podcastguid: 'int:podcastguid:917393e3-1b1e-5cef-ace4-edaa54e1f810',
			url: 'int:url:https://example.com/page',
			caip10: 'int:caip10:eip155:1:0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
			caip19: 'int:caip19:eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
			hash: `int:hash:sha256:${'a'.repeat(64)}`,
			appid: 'int:appid:ios:com.example.app',
			purl: 'int:purl:npm/left-pad',
			geo: 'int:geo:9q8yyk8y',
			acct: 'int:acct:github:torvalds',
			rssitem: `int:rssitem:917393e3-1b1e-5cef-ace4-edaa54e1f810:${'a'.repeat(32)}`,
			termset: `int:termset:${'a'.repeat(32)}:genre`,
			gen1: `int:gen1:person:r4:${'a'.repeat(32)}`,
		};

		for (const scheme of SCHEME_NAMES) {
			const hints = identifierHintsForIid(samples[scheme]);
			expect(Object.keys(hints).length, `${scheme}: sample did not canonicalize`).toBeGreaterThan(
				0
			);

			for (const [key, value] of Object.entries(hints)) {
				expect(value.length, `${scheme} ${key}`).toBeGreaterThan(0);
			}
		}
	});
});
