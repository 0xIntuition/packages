import { parseIntuitionId, SCHEMES, type SchemeName, validateIntuitionId } from '@0xintuition/iid';
import { providersForIid } from '@0xintuition/iid-registry';
import { describe, expect, it } from 'vitest';
import {
	IID_VALUE_MAX_LENGTH,
	PROVIDER_PREFIX_MAPPINGS,
	projectIdentifierLadder,
	schemeOrderForIdentityCategory,
	UNREGISTERED_PROVIDER_LOCAL_PREFIXES,
} from '../index.js';

const PROVIDER_CASES = [
	{ canonicalId: 'github:user:octocat', expected: 'int:acct:github:@octocat' },
	{
		canonicalId: 'github:repo:0xintuition/intuition',
		expected: 'int:purl:github/0xintuition/intuition',
	},
	{ canonicalId: 'imdb:title:tt0111161', expected: 'int:imdb:tt0111161' },
	{ canonicalId: 'imdb:name:nm0000151', expected: 'int:imdb:nm0000151' },
	{ canonicalId: 'tmdb:movie:278', expected: 'int:tmdb:movie:278' },
	{ canonicalId: 'tmdb:tv:1396', expected: 'int:tmdb:tv:1396' },
	{ canonicalId: 'openlibrary:work:OL45883W', expected: 'int:olid:OL45883W' },
	{ canonicalId: 'openlibrary:book:OL7353617M', expected: 'int:olid:OL7353617M' },
	{
		canonicalId: 'npm:package:@tanstack/react-query',
		expected: 'int:purl:npm/tanstack/react-query',
	},
	{ canonicalId: 'x:user:jack', expected: 'int:acct:x:@jack' },
	{ canonicalId: 'isbn:9780140328721', expected: 'int:isbn:9780140328721' },
	{ canonicalId: 'wd:film:Q751921', expected: 'int:wd:film:Q751921' },
	{
		canonicalId: 'eip155:1:0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
		expected: 'int:caip10:eip155:1:0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
	},
] as const;

const PROVIDER_LOCAL_CASES = [
	'podcast-index:3421639',
	'spotify:track:4uLU6hMCjMI75M1A2tKUQC',
	'spotify:album:6DEjYFkNZh67HP7R9PSZvv',
	'spotify:artist:0gxyHStUsqpMadRV0Di1Qt',
	'spotify:playlist:37i9dQZF1DXcBWIGoYBM5M',
	'spotify:show:2MAi0BvDc6GTFvKFPXnkCL',
	'spotify:episode:512ojhOuo1ktJprKbVcKyQ',
	'github:org:0xintuition',
	'github:issue:0xintuition/intuition#14426',
	'github:pull:0xintuition/intuition#958',
	'github:commit:0xintuition/intuition:abcdef123456',
	'youtube:video:dQw4w9WgXcQ',
	'wikipedia:douglas-adams',
	'steam:app:620',
	'coingecko:bitcoin',
	'coinmarketcap:bitcoin',
	'etsy:listing:1234567890',
	'shopify:product:acme-store.myshopify.com:handmade-blue-mug',
	'goodreads:book:4671',
	'letterboxd:film:moonlight',
	'amazon:store:https-amazon-com-stores-fixture',
	'asin:0062316095',
	'instagram:user:instagram',
	'instagram:video:CxYQwZ123',
	'instagram:post:CxYQwZ456',
	'tiktok:user:tiktok',
	'tiktok:video:7260000000000000000',
	'x:post:20',
	'places:https-maps-google-com-place-fixture',
	'ens:vitalik.eth',
] as const;

const CRISP_PROVIDER_ID_CASES = [
	{
		providerCanonicalId: 'spotify:track:4uLU6hMCjMI75M1A2tKUQC',
		slugifiedCanonicalId: 'spotify:track:https-open-spotify-com-track-fixture',
	},
	{
		providerCanonicalId: 'spotify:album:6DEjYFkNZh67HP7R9PSZvv',
		slugifiedCanonicalId: 'spotify:album:https-open-spotify-com-album-fixture',
	},
	{
		providerCanonicalId: 'spotify:artist:0gxyHStUsqpMadRV0Di1Qt',
		slugifiedCanonicalId: 'spotify:artist:https-open-spotify-com-artist-fixture',
	},
	{
		providerCanonicalId: 'spotify:playlist:37i9dQZF1DXcBWIGoYBM5M',
		slugifiedCanonicalId: 'spotify:playlist:https-open-spotify-com-playlist-fixture',
	},
	{
		providerCanonicalId: 'spotify:show:2MAi0BvDc6GTFvKFPXnkCL',
		slugifiedCanonicalId: 'spotify:show:https-open-spotify-com-show-fixture',
	},
	{
		providerCanonicalId: 'spotify:episode:512ojhOuo1ktJprKbVcKyQ',
		slugifiedCanonicalId: 'spotify:episode:https-open-spotify-com-episode-fixture',
	},
	{
		providerCanonicalId: 'youtube:video:dQw4w9WgXcQ',
		slugifiedCanonicalId: 'youtube:video:https-youtube-com-watch-v-fixture',
	},
	{
		providerCanonicalId: 'x:post:1920505170888216700',
		slugifiedCanonicalId: 'x:post:https-x-com-jack-status-fixture',
	},
] as const;

const REGISTERED_PROVIDER_EXPECTATIONS = [
	{ providerPrefix: 'github:user:', providers: ['github'] },
	{ providerPrefix: 'github:repo:', providers: ['github'] },
	{ providerPrefix: 'imdb:title:', providers: ['tmdb', 'wikidata'] },
	{ providerPrefix: 'imdb:name:', providers: ['tmdb', 'wikidata'] },
	{ providerPrefix: 'tmdb:movie:', providers: ['tmdb'] },
	{ providerPrefix: 'tmdb:tv:', providers: ['tmdb'] },
	{ providerPrefix: 'openlibrary:work:', providers: ['openlibrary'] },
	{ providerPrefix: 'openlibrary:book:', providers: ['openlibrary'] },
	{ providerPrefix: 'npm:package:', providers: ['npm'] },
	{ providerPrefix: 'x:user:', providers: ['x-profile'] },
	{ providerPrefix: 'isbn:', providers: ['openlibrary'] },
	{ providerPrefix: 'wd:', providers: ['wikidata'] },
	{ providerPrefix: 'eip155:', providers: ['etherscan'] },
] as const;

describe('projectIdentifierLadder', () => {
	it.each([
		['tmdb:movie:550', 'handle'],
		['int:tmdb:movie:550', 'strong'],
	] as const)('ranks provider %s with direct strong identifiers in category order', (providerCanonicalId, rung) => {
		expect(
			projectIdentifierLadder({
				strongIdentifierOrder: schemeOrderForIdentityCategory('movie'),
				strongIdentifiers: { imdb: 'tt0073629' },
				providerCanonicalId,
			})
		).toEqual({ iid: 'int:tmdb:movie:550', rung });
	});

	it('keeps a higher category rung ahead of a promoted provider handle', () => {
		expect(
			projectIdentifierLadder({
				strongIdentifierOrder: schemeOrderForIdentityCategory('movie'),
				strongIdentifiers: { wd: 'film:Q42' },
				providerCanonicalId: 'tmdb:movie:550',
			})
		).toEqual({ iid: 'int:wd:film:Q42', rung: 'strong' });
	});

	it('does not promote provider-local handles when a category order is present', () => {
		expect(
			projectIdentifierLadder({
				strongIdentifierOrder: schemeOrderForIdentityCategory('song'),
				providerCanonicalId: 'spotify:track:1kcfGBb6kSrGqNIMW7rAlB',
				canonicalUrl: 'https://example.com/item',
			})
		).toEqual({ iid: null, fallback: 'envelope', reason: 'unregistered-provider' });
	});

	it.each([
		'wd:Q42',
		'wd:written-work:Q47461344',
		'int:wd:written-work:Q47461344',
	])('refuses nonmintable WD provider value %s with and without category ordering', (providerCanonicalId) => {
		for (const strongIdentifierOrder of [undefined, ['wd']]) {
			expect(projectIdentifierLadder({ providerCanonicalId, strongIdentifierOrder })).toEqual({
				iid: null,
				fallback: 'envelope',
				reason: 'invalid-handle',
			});
		}
	});

	it('rejects conflicting QIDs across WD aliases before falling through', () => {
		expect(
			projectIdentifierLadder({
				strongIdentifierOrder: ['wd', 'tmdb'],
				strongIdentifiers: { wd: 'film:Q42', wikidata: 'Q43', tmdb: 'movie:550' },
			})
		).toEqual({ iid: 'int:tmdb:movie:550', rung: 'strong' });
	});

	it('selects strong identifiers before handles and URLs', () => {
		expect(
			projectIdentifierLadder({
				canonicalUrl: 'https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC',
				providerCanonicalId: 'spotify:track:4uLU6hMCjMI75M1A2tKUQC',
				strongIdentifiers: { isrc: 'GBARL9300135' },
			})
		).toEqual({ iid: 'int:isrc:GBARL9300135', rung: 'strong' });
	});

	it('honors a classification-specific strong-rung order', () => {
		expect(
			projectIdentifierLadder({
				strongIdentifierOrder: ['isrc', 'isbn'],
				strongIdentifiers: {
					isbn: '9780140328721',
					isrc: 'GBARL9300135',
				},
			})
		).toEqual({ iid: 'int:isrc:GBARL9300135', rung: 'strong' });
	});

	it('treats a classification-specific strong-rung order as an allowlist', () => {
		expect(
			projectIdentifierLadder({
				strongIdentifierOrder: ['isrc'],
				strongIdentifiers: { wd: 'Q42' },
			})
		).toEqual({ fallback: 'envelope', iid: null, reason: 'no-identifier' });
	});

	it.each([
		'int:isbn:9780140328721',
		'int:isrc:USQX91300108',
	])('passes an already-canonical provider ID through as strong: %s', (iid) => {
		expect(projectIdentifierLadder({ providerCanonicalId: iid })).toEqual({ iid, rung: 'strong' });
	});

	it('rejects a non-canonical int-shaped provider ID as an invalid handle', () => {
		expect(projectIdentifierLadder({ providerCanonicalId: 'int:isbn:0-14-032872-6' })).toEqual({
			fallback: 'envelope',
			iid: null,
			reason: 'invalid-handle',
		});
	});

	it('selects a canonical URL when no stronger rung is present', () => {
		expect(projectIdentifierLadder({ canonicalUrl: 'https://example.com/item' })).toEqual({
			iid: 'int:url:https://example.com/item',
			rung: 'url',
		});
	});

	it.each(PROVIDER_CASES)('maps $canonicalId', ({ canonicalId, expected }) => {
		expect(projectIdentifierLadder({ providerCanonicalId: canonicalId })).toEqual({
			iid: expected,
			rung: 'handle',
		});
	});

	it('keeps the provider-prefix fixture table aligned with the exported mapping', () => {
		const registeredMappings = PROVIDER_PREFIX_MAPPINGS.filter(
			(mapping) => mapping.kind === 'registered'
		);
		expect(PROVIDER_CASES).toHaveLength(registeredMappings.length);
		expect(PROVIDER_CASES.map(({ canonicalId }) => canonicalId)).toEqual(
			registeredMappings.map(
				({ providerPrefix }) =>
					PROVIDER_CASES.find(({ canonicalId }) => canonicalId.startsWith(providerPrefix))
						?.canonicalId
			)
		);
	});

	it('round-trips every registered-scheme row through frozen provider expectations', () => {
		const registeredMappings = PROVIDER_PREFIX_MAPPINGS.filter(
			(mapping) => mapping.kind === 'registered'
		);
		expect(registeredMappings.map(({ providerPrefix }) => providerPrefix)).toEqual(
			REGISTERED_PROVIDER_EXPECTATIONS.map(({ providerPrefix }) => providerPrefix)
		);

		for (const expectation of REGISTERED_PROVIDER_EXPECTATIONS) {
			const fixture = PROVIDER_CASES.find(({ canonicalId }) =>
				canonicalId.startsWith(expectation.providerPrefix)
			);
			expect(fixture, expectation.providerPrefix).toBeDefined();
			if (!fixture) {
				continue;
			}
			const result = projectIdentifierLadder({ providerCanonicalId: fixture.canonicalId });
			expect(result, expectation.providerPrefix).toEqual({
				iid: fixture.expected,
				rung: 'handle',
			});
			expect(providersForIid(fixture.expected), expectation.providerPrefix).toEqual(
				expectation.providers
			);
		}
	});

	it('pins every known unregistered mapping as provider-local', () => {
		const providerLocalMappings = PROVIDER_PREFIX_MAPPINGS.filter(
			(mapping) => mapping.kind === 'provider-local'
		);
		expect(providerLocalMappings.map(({ providerPrefix }) => providerPrefix)).toEqual(
			UNREGISTERED_PROVIDER_LOCAL_PREFIXES
		);
		expect(PROVIDER_LOCAL_CASES).toHaveLength(providerLocalMappings.length);
		for (const mapping of providerLocalMappings) {
			const canonicalId = PROVIDER_LOCAL_CASES.find((value) =>
				value.startsWith(mapping.providerPrefix)
			);
			expect(canonicalId, mapping.providerPrefix).toBeDefined();
			if (!canonicalId) continue;
			expect(projectIdentifierLadder({ providerCanonicalId: canonicalId })).toEqual({
				fallback: 'envelope',
				iid: null,
				reason: 'unregistered-provider',
			});
			expect(parseIntuitionId(`int:${canonicalId}`), mapping.providerPrefix).toBeUndefined();
			expect(providersForIid(`int:${canonicalId}`), mapping.providerPrefix).toHaveLength(0);
		}
	});

	it('accepts active typed wd without crashing and refuses bare or dormant values', () => {
		expect(projectIdentifierLadder({ strongIdentifiers: { wd: 'film:Q42' } })).toEqual({
			iid: 'int:wd:film:Q42',
			rung: 'strong',
		});
		expect(projectIdentifierLadder({ strongIdentifiers: { identifier: 'Q42' } })).toEqual({
			fallback: 'envelope',
			iid: null,
			reason: 'no-identifier',
		});
		expect(
			projectIdentifierLadder({ strongIdentifiers: { wd: 'written-work:Q47461344' } })
		).toEqual({ fallback: 'envelope', iid: null, reason: 'no-identifier' });
	});

	it('reassembles mbid-style split wd hints before strong selection', () => {
		expect(
			projectIdentifierLadder({
				strongIdentifiers: { wd: 'Q42', wdSlug: 'film', wikidata: 'Q42' },
			})
		).toEqual({ iid: 'int:wd:film:Q42', rung: 'strong' });
		expect(
			projectIdentifierLadder({
				strongIdentifiers: { wd: 'Q47461344', wdSlug: 'written-work' },
			})
		).toEqual({ fallback: 'envelope', iid: null, reason: 'no-identifier' });
	});

	it('rejects a typed wd value when its split hint claims a different active slug', () => {
		expect(
			projectIdentifierLadder({
				strongIdentifiers: {
					wd: 'television-series:Q42',
					wdSlug: 'film',
					wikidata: 'Q42',
				},
			})
		).toEqual({ fallback: 'envelope', iid: null, reason: 'no-identifier' });
	});

	it('rejects a WD candidate when a supplied split slug is dormant', () => {
		expect(
			projectIdentifierLadder({
				strongIdentifiers: {
					tmdb: 'movie:603',
					wd: 'film:Q42',
					wdSlug: 'written-work',
				},
			})
		).toEqual({ iid: 'int:tmdb:movie:603', rung: 'strong' });
	});

	it('rejects all WD aliases when typed hints conflict and falls through', () => {
		expect(
			projectIdentifierLadder({
				strongIdentifiers: {
					tmdb: 'movie:603',
					wd: 'film:Q42',
					wikidata: 'television-series:Q42',
				},
			})
		).toEqual({ iid: 'int:tmdb:movie:603', rung: 'strong' });
	});

	it('passes only active typed wd through an int-shaped provider identifier', () => {
		expect(projectIdentifierLadder({ providerCanonicalId: 'int:wd:film:Q42' })).toEqual({
			iid: 'int:wd:film:Q42',
			rung: 'strong',
		});
		expect(projectIdentifierLadder({ providerCanonicalId: 'int:wd:Q42' })).toEqual({
			fallback: 'envelope',
			iid: null,
			reason: 'invalid-handle',
		});
	});

	it('canonicalizes strong identifiers through their registered scheme', () => {
		expect(projectIdentifierLadder({ strongIdentifiers: { isbn: '0-14-032872-6' } })).toEqual({
			iid: 'int:isbn:9780140328721',
			rung: 'strong',
		});
	});

	it('returns invalid-handle when a mapped prefix has a degraded value', () => {
		expect(
			projectIdentifierLadder({
				canonicalUrl: 'https://imdb.com/title/tt0111161',
				providerCanonicalId: 'imdb:title:the-shawshank-redemption',
			})
		).toEqual({ fallback: 'envelope', iid: null, reason: 'invalid-handle' });
	});

	it('canonicalizes registered provider values before validating them', () => {
		expect(projectIdentifierLadder({ providerCanonicalId: 'isbn:0-14-032872-6' })).toEqual({
			iid: 'int:isbn:9780140328721',
			rung: 'handle',
		});
	});

	it('canonicalizes a mixed-case GitHub handle to the weak acct form', () => {
		expect(projectIdentifierLadder({ providerCanonicalId: 'github:user:OctoCat' })).toEqual({
			iid: 'int:acct:github:@octocat',
			rung: 'handle',
		});
	});

	it.each(CRISP_PROVIDER_ID_CASES)('rejects the slugified pseudo-handle $slugifiedCanonicalId', ({
		slugifiedCanonicalId,
	}) => {
		expect(
			projectIdentifierLadder({
				canonicalUrl: 'https://example.com/fallback-must-not-win',
				providerCanonicalId: slugifiedCanonicalId,
			})
		).toEqual({ fallback: 'envelope', iid: null, reason: 'invalid-handle' });
	});

	it('distinguishes an Amazon fallback slug from a valid ASIN handle', () => {
		expect(
			projectIdentifierLadder({ providerCanonicalId: 'asin:https-amazon-com-dp-fixture' })
		).toEqual({ fallback: 'envelope', iid: null, reason: 'invalid-handle' });
	});

	it('returns unmapped-provider without guessing from the URL', () => {
		expect(
			projectIdentifierLadder({
				canonicalUrl: 'https://example.com/item',
				providerCanonicalId: 'unknown:item:1',
			})
		).toEqual({ fallback: 'envelope', iid: null, reason: 'unmapped-provider' });
	});

	it('pins term canonical IDs as intentionally unmapped', () => {
		expect(projectIdentifierLadder({ providerCanonicalId: 'term:semantic-grounding' })).toEqual({
			fallback: 'envelope',
			iid: null,
			reason: 'unmapped-provider',
		});
	});

	it('routes a default-URL canonical id through the URL rung', () => {
		expect(projectIdentifierLadder({ providerCanonicalId: 'https://example.com/item' })).toEqual({
			iid: 'int:url:https://example.com/item',
			rung: 'url',
		});
	});

	it('accepts a URL value at exactly the 220-character cap', () => {
		const prefix = 'https://example.com/';
		const canonicalUrl = `${prefix}${'a'.repeat(IID_VALUE_MAX_LENGTH - prefix.length)}`;

		expect(canonicalUrl).toHaveLength(IID_VALUE_MAX_LENGTH);
		expect(projectIdentifierLadder({ canonicalUrl })).toEqual({
			iid: `int:url:${canonicalUrl}`,
			rung: 'url',
		});
	});

	it('returns envelope fallback for a 221-character URL value', () => {
		const prefix = 'https://example.com/';
		const canonicalUrl = `${prefix}${'a'.repeat(IID_VALUE_MAX_LENGTH + 1 - prefix.length)}`;

		expect(canonicalUrl).toHaveLength(IID_VALUE_MAX_LENGTH + 1);
		expect(projectIdentifierLadder({ canonicalUrl })).toEqual({
			fallback: 'envelope',
			iid: null,
			reason: 'url-over-cap',
		});
	});

	it('returns no-identifier for plain text with no identity inputs', () => {
		expect(projectIdentifierLadder({})).toEqual({
			fallback: 'envelope',
			iid: null,
			reason: 'no-identifier',
		});
	});
});

const IDEMPOTENT_SCHEME_VALUES = {
	isbn: ['0-684-83272-0'],
	isrc: ['us-sm1-00-07459'],
	iswc: ['T0000000009'],
	isni: ['0000000121032683'],
	orcid: ['0000-0002-1825-0097'],
	lei: ['5493001KJTIIGC8Y1R12'],
	gtin: ['036000291452'],
	doi: ['https://doi.org/10.48550/ARXIV.1706.03762'],
	eidr: ['10.5240/7791-8534-2C23-9030-8610-5'],
	wd: ['q42', 'film:Q2346467', 'television-series:Q72085'],
	mbid: ['artist:056e4f3e-d505-4dad-8ec1-d04f521cbb56'],
	olid: ['OL45804W'],
	imdb: ['tt0073629'],
	tmdb: ['movie:603', 'tv:1399'],
	podcastguid: ['f77016bc-fd74-5c94-893f-864deb06fc30'],
	url: ['https://example.com/?utm_source=test'],
	caip10: ['eip155:1:0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'],
	caip19: ['eip155:1/erc20:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'],
	hash: [`sha256:${'ab'.repeat(32)}`],
	appid: ['android:com.spotify.music'],
	purl: ['pkg:npm/react@18.2.0'],
	geo: ['u4pruydqqvj'],
	acct: ['github:@Torvalds'],
	rssitem: [`f77016bc-fd74-5c94-893f-864deb06fc30:${'ab'.repeat(16)}`],
	termset: [`${'ab'.repeat(16)}:test`],
	gen1: [`movie:r1:${'ab'.repeat(16)}`],
} satisfies Record<SchemeName, string[]>;

it.each(
	Object.entries(IDEMPOTENT_SCHEME_VALUES)
)('%s canonicalization is idempotent on its output', (scheme, values) => {
	for (const value of values) {
		const canonicalize = SCHEMES[scheme as SchemeName].canonicalize;
		const canonical = canonicalize(value);
		expect(canonical).toBeDefined();
		expect(canonicalize(canonical!)).toBe(canonical);
	}
});
it('idempotency fixtures cover every registered scheme', () => {
	expect(Object.keys(IDEMPOTENT_SCHEME_VALUES).sort()).toEqual(Object.keys(SCHEMES).sort());
});

describe('projectIdentifierLadder', () => {
	it('selects a canonical strong identifier before provider and URL inputs', () => {
		expect(
			projectIdentifierLadder({
				canonicalUrl: 'https://open.spotify.com/track/1kcfGBb6kSrGqNIMW7rAlB',
				providerCanonicalId: 'spotify:track:1kcfGBb6kSrGqNIMW7rAlB',
				strongIdentifiers: { isrc: 'USUM71703861' },
			})
		).toEqual({ iid: 'int:isrc:USUM71703861', rung: 'strong' });
	});

	it('uses classification order as both precedence and allowlist', () => {
		expect(
			projectIdentifierLadder({
				strongIdentifierOrder: ['isrc'],
				strongIdentifiers: { isbn: '9780140328721', isrc: 'USUM71703861' },
			})
		).toEqual({ iid: 'int:isrc:USUM71703861', rung: 'strong' });
	});

	it.each([
		['isbn:0-14-032872-6', 'int:isbn:9780140328721', ['openlibrary']],
		['github:user:OctoCat', 'int:acct:github:@octocat', ['github']],
		['openlibrary:work:OL45883W', 'int:olid:OL45883W', ['openlibrary']],
		[
			'eip155:1:0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
			'int:caip10:eip155:1:0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
			['etherscan'],
		],
	] as const)('maps registered provider handle %s', (providerCanonicalId, iid, providers) => {
		const result = projectIdentifierLadder({ providerCanonicalId });
		expect(result).toEqual({ iid, rung: 'handle' });
		expect(validateIntuitionId(iid)).toBe(true);
		expect(providersForIid(iid)).toEqual(providers);
	});

	it('never promotes a known provider-local namespace into an invalid IID', () => {
		expect(
			projectIdentifierLadder({
				providerCanonicalId: 'spotify:track:1kcfGBb6kSrGqNIMW7rAlB',
			})
		).toEqual({ fallback: 'envelope', iid: null, reason: 'unregistered-provider' });
		expect(validateIntuitionId('int:spotify:track:1kcfGBb6kSrGqNIMW7rAlB')).toBe(false);
	});

	it('distinguishes malformed known handles from unregistered namespaces', () => {
		expect(projectIdentifierLadder({ providerCanonicalId: 'spotify:track:not-a-real-id' })).toEqual(
			{ fallback: 'envelope', iid: null, reason: 'invalid-handle' }
		);
	});

	it('keeps the provider-local audit list derived from the frozen map', () => {
		expect(UNREGISTERED_PROVIDER_LOCAL_PREFIXES).toEqual(
			PROVIDER_PREFIX_MAPPINGS.filter((mapping) => mapping.kind === 'provider-local').map(
				(mapping) => mapping.providerPrefix
			)
		);
	});

	it('uses a canonical URL only when no provider canonical ID claims precedence', () => {
		expect(projectIdentifierLadder({ canonicalUrl: 'https://example.com/item' })).toEqual({
			iid: 'int:url:https://example.com/item',
			rung: 'url',
		});
	});

	it('enforces the IID value cap', () => {
		const prefix = 'https://example.com/';
		const atCap = `${prefix}${'a'.repeat(IID_VALUE_MAX_LENGTH - prefix.length)}`;
		const overCap = `${atCap}a`;
		expect(projectIdentifierLadder({ canonicalUrl: atCap })).toEqual({
			iid: `int:url:${atCap}`,
			rung: 'url',
		});
		expect(projectIdentifierLadder({ canonicalUrl: overCap })).toEqual({
			fallback: 'envelope',
			iid: null,
			reason: 'url-over-cap',
		});
	});
});
