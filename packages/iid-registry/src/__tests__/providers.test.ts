import { SCHEME_NAMES } from '@0xintuition/iid';
import { describe, expect, it } from 'vitest';

import {
	PROVIDER_SLUGS,
	PROVIDERS_BY_SCHEME,
	providersForIid,
	providersForScheme,
} from '../providers.js';

describe('providersForScheme', () => {
	it('is total over every registered scheme', () => {
		for (const scheme of SCHEME_NAMES) {
			expect(Array.isArray(providersForScheme(scheme)), scheme).toBe(true);
		}

		expect(new Set(Object.keys(PROVIDERS_BY_SCHEME))).toEqual(new Set(SCHEME_NAMES));
	});

	it('only emits slugs from the ProviderSlug union, without duplicates', () => {
		const known = new Set<string>(PROVIDER_SLUGS);

		for (const scheme of SCHEME_NAMES) {
			const providers = providersForScheme(scheme);
			expect(new Set(providers).size, scheme).toBe(providers.length);

			for (const provider of providers) {
				expect(known.has(provider), `${scheme} -> ${provider}`).toBe(true);
			}
		}
	});

	it('every declared ProviderSlug is reachable from at least one scheme', () => {
		const reachable = new Set(SCHEME_NAMES.flatMap((scheme) => [...providersForScheme(scheme)]));

		for (const slug of PROVIDER_SLUGS) {
			expect(reachable.has(slug), slug).toBe(true);
		}
	});

	it('orders open/no-key providers ahead of credentialed ones (D-10/D27)', () => {
		expect(providersForScheme('isrc')).toEqual(['musicbrainz', 'spotify', 'apple-music']);
		expect(providersForScheme('isbn')).toEqual(['openlibrary']);
		expect(providersForScheme('caip19')).toEqual(['coingecko', 'etherscan']);
		expect(providersForScheme('imdb')).toEqual(['tmdb', 'wikidata']);
	});

	it('keeps url an empty sentinel (URL-first pipeline owns it)', () => {
		expect(providersForScheme('url')).toEqual([]);
		expect(providersForScheme('gen1')).toEqual([]);
		expect(providersForScheme('hash')).toEqual([]);
	});
});

describe('providersForIid', () => {
	it('narrows acct by platform segment', () => {
		expect(providersForIid('int:acct:github:torvalds')).toEqual(['github']);
		expect(providersForIid('int:acct:x:@jack')).toEqual(['x-profile']);
		expect(providersForIid('int:acct:twitter:@jack')).toEqual(['x-profile']);
		expect(providersForIid('int:acct:farcaster:dwr')).toEqual([]);
	});

	it('narrows purl by package type', () => {
		expect(providersForIid('int:purl:npm/left-pad')).toEqual(['npm']);
		expect(providersForIid('int:purl:github/0xintuition/packages')).toEqual(['github']);
		expect(providersForIid('int:purl:cargo/serde')).toEqual([]);
	});

	it('narrows chain schemes to eip155 namespaces', () => {
		expect(
			providersForIid('int:caip19:eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48')
		).toEqual(['coingecko', 'etherscan']);
		expect(
			providersForIid('int:caip10:eip155:1:0xd8da6bf26964af9d7eed9e03e53415d37aa96045')
		).toEqual(['etherscan']);
		expect(
			providersForIid(
				'int:caip19:solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/spl:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
			)
		).toEqual([]);
	});

	it('falls back to the scheme list for value-independent schemes', () => {
		expect(providersForIid('int:isrc:USUM71703861')).toEqual([
			'musicbrainz',
			'spotify',
			'apple-music',
		]);
		expect(providersForIid('int:wd:Q42')).toEqual(['wikidata']);
	});

	it('returns no providers for malformed or uncanonicalizable IIDs', () => {
		expect(providersForIid('int:isrc:nope')).toEqual([]);
		expect(providersForIid('not an iid')).toEqual([]);
		expect(providersForIid('int:nosuchscheme:x')).toEqual([]);
	});
});
