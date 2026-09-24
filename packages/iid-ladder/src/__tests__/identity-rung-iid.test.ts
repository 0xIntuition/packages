import { isCanonicalNodeIid } from '@0xintuition/iid';
import { describe, expect, it } from 'vitest';
import {
	IDENTITY_CATEGORY_RUNG_POLICY,
	type IdentityRungToken,
	iidForIdentityRung,
	projectIdentifierLadder,
} from '../index.js';

describe('iidForIdentityRung', () => {
	const cases = [
		[
			'imdb:title',
			'tt0073629',
			{ strongIdentifiers: { imdb: 'tt0073629' }, strongIdentifierOrder: ['imdb'] },
			'int:imdb:tt0073629',
		],
		[
			'isbn',
			'9780140328721',
			{ strongIdentifiers: { isbn: '9780140328721' }, strongIdentifierOrder: ['isbn'] },
			'int:isbn:9780140328721',
		],
		[
			'isrc',
			'USSM10007459',
			{ strongIdentifiers: { isrc: 'USSM10007459' }, strongIdentifierOrder: ['isrc'] },
			'int:isrc:USSM10007459',
		],
		[
			'olid',
			'OL45804W',
			{ strongIdentifiers: { olid: 'OL45804W' }, strongIdentifierOrder: ['olid'] },
			'int:olid:OL45804W',
		],
		[
			'podcastguid',
			'9b024349-ccf0-5f69-a609-6b82873eab3c',
			{
				strongIdentifiers: { podcastguid: '9b024349-ccf0-5f69-a609-6b82873eab3c' },
				strongIdentifierOrder: ['podcastguid'],
			},
			'int:podcastguid:9b024349-ccf0-5f69-a609-6b82873eab3c',
		],
		[
			'rssitem',
			'9b024349-ccf0-5f69-a609-6b82873eab3c:0123456789abcdef0123456789abcdef',
			{
				strongIdentifiers: {
					rssitem: '9b024349-ccf0-5f69-a609-6b82873eab3c:0123456789abcdef0123456789abcdef',
				},
				strongIdentifierOrder: ['rssitem'],
			},
			'int:rssitem:9b024349-ccf0-5f69-a609-6b82873eab3c:0123456789abcdef0123456789abcdef',
		],
		...(['movie', 'tv'] as const).map(
			(type) =>
				[
					`tmdb:${type}`,
					'550',
					{ strongIdentifiers: { tmdb: `${type}:550` }, strongIdentifierOrder: ['tmdb'] },
					`int:tmdb:${type}:550`,
				] as const
		),
		...(['film', 'television-series'] as const).map(
			(type) =>
				[
					`wd:${type}`,
					'Q485271',
					{ strongIdentifiers: { wd: 'Q485271', wdSlug: type }, strongIdentifierOrder: ['wd'] },
					`int:wd:${type}:Q485271`,
				] as const
		),
	] as const;

	const providerLocalCases = [
		['goodreads:book', '123'],
		['podcast-index', '123'],
		['spotify:episode', '5xcunlfaZvD9BDQsLONI7A'],
		['spotify:show', '5xcunlfaZvD9BDQsLONI7A'],
		['spotify:track', '5xcunlfaZvD9BDQsLONI7A'],
	] as const;

	it('provider-local rung tokens stay unmapped until R16', () => {
		for (const [rung, value] of providerLocalCases) {
			expect(iidForIdentityRung(rung, value), rung).toBeUndefined();
			expect(projectIdentifierLadder({ providerCanonicalId: `${rung}:${value}` })).toEqual({
				iid: null,
				fallback: 'envelope',
				reason: 'unregistered-provider',
			});
		}
	});

	it('covers every policy token', () => {
		expect(new Set([...cases, ...providerLocalCases].map((c) => c[0]))).toEqual(
			new Set(Object.values(IDENTITY_CATEGORY_RUNG_POLICY).flat())
		);
	});
	it.each(
		cases
	)('%s agrees with provider-preview ladder projection', (rung, value, input, expected) => {
		expect(projectIdentifierLadder(input).iid).toBe(expected);
		expect(iidForIdentityRung(rung as IdentityRungToken, value)).toBe(expected);
		expect(isCanonicalNodeIid(expected)).toBe(true);
	});
	it('drops invalid and wrong-subtype entries and canonicalizes spelling', () => {
		expect(iidForIdentityRung('isbn', 'garbage')).toBeUndefined();
		expect(iidForIdentityRung('imdb:title', 'nm0000001')).toBeUndefined();
		expect(iidForIdentityRung('tmdb:movie', 'tv:550')).toBeUndefined();
		expect(iidForIdentityRung('wd:film', 'television-series:Q123')).toBeUndefined();
		expect(iidForIdentityRung('isrc', 'us-sm1-00-07459')).toBe('int:isrc:USSM10007459');
	});

	const rawVariants = [
		['isbn', '0140328726', '9780140328721'],
		['isrc', 'ussm10007459', 'USSM10007459'],
		['imdb:title', 'TT0073629', 'tt0073629'],
		['olid', 'ol45804w', 'OL45804W'],
		['olid', 'OL123M', 'OL123M'],
		['wd:film', 'q485271', 'Q485271'],
		['wd:television-series', 'q485271', 'Q485271'],
		['podcastguid', '9B024349-CCF0-5F69-A609-6B82873EAB3C', '9b024349-ccf0-5f69-a609-6b82873eab3c'],
		[
			'rssitem',
			'9B024349-CCF0-5F69-A609-6B82873EAB3C:0123456789ABCDEF0123456789ABCDEF',
			'9b024349-ccf0-5f69-a609-6b82873eab3c:0123456789abcdef0123456789abcdef',
		],
		['tmdb:movie', '550 ', 'movie:550'],
		['tmdb:tv', '550 ', 'tv:550'],
	] as const;

	it.each(
		rawVariants
	)('%s raw %s agrees at the preview strong-identifier seam', (token, raw, canonical) => {
		const [scheme, subtype] = token.split(':') as [string, string | undefined];
		// TMDB preview sources supply the structural subtype; the helper accepts a local suffix.
		const value = scheme === 'tmdb' ? `${subtype}:${raw}` : raw;
		const ladder = projectIdentifierLadder({
			strongIdentifiers: {
				[scheme]: value,
				...(scheme === 'wd' ? { wdSlug: subtype as string } : {}),
			},
			strongIdentifierOrder: [scheme],
		}).iid;
		const expected = `int:${scheme}:${scheme === 'wd' ? `${subtype}:` : ''}${canonical}`;
		expect(iidForIdentityRung(token, raw)).toBe(expected);
		expect(ladder).toBe(expected);
	});
});
