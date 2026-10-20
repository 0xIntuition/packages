import { describe, expect, it } from 'vitest';
import {
	type LadderInput,
	type LadderResult,
	projectIdentifierLadder,
	schemeOrderForIdentityCategory,
} from '../index.js';

// Authored by executing the pinned reference on normalized copies of these fixtures:
// malformed-isbn becomes {}; invalid-split becomes { wd: 'film:Q1' }; all others stay as shown.
// E1: typed-film/invalid-split/redundant-alias/conflicting-split x human/int-human.
// E2: music-album x GTIN. Exclusions remove the provider BEFORE reference execution.
// No reference imports or expected-result generation at test runtime.
const DIRECTS: Record<string, NonNullable<LadderInput['strongIdentifiers']>> = {
	none: {},
	'valid-isbn': {
		isbn: '9780140328721',
	},
	'malformed-isbn': {
		isbn: 'garbage',
	},
	'bare-wd': {
		wd: 'Q1',
	},
	'typed-film': {
		wd: 'film:Q1',
	},
	'invalid-split': {
		wd: 'film:Q1',
		wdSlug: 'garbage',
	},
	'redundant-alias': {
		wd: 'film:Q1',
		wikidata: 'Q1',
	},
	'conflicting-split': {
		wd: 'film:Q1',
		wdSlug: 'television-series',
	},
};
const PROVIDERS: Record<string, string | undefined> = {
	none: undefined,
	'isbn-same': 'isbn:9780140328721',
	'isbn-different': 'isbn:9780306406157',
	'wd-bare': 'wd:Q2',
	'wd-film': 'wd:film:Q2',
	'wd-human': 'wd:human:Q2',
	'int-wd-human': 'int:wd:human:Q2',
	gtin: 'int:gtin:00012345600012',
	unknown: 'unknown:item:1',
};
const RESULTS: Record<string, LadderResult> = {
	R0: { fallback: 'envelope', iid: null, reason: 'no-identifier' },
	R1: { iid: 'int:url:https://example.com/item', rung: 'url' },
	R2: { iid: 'int:isbn:9780140328721', rung: 'handle' },
	R3: { iid: 'int:isbn:9780306406157', rung: 'handle' },
	R4: { fallback: 'envelope', iid: null, reason: 'invalid-handle' },
	R5: { iid: 'int:wd:film:Q2', rung: 'handle' },
	R6: { iid: 'int:wd:human:Q2', rung: 'handle' },
	R7: { iid: 'int:wd:human:Q2', rung: 'strong' },
	R8: { iid: 'int:gtin:00012345600012', rung: 'strong' },
	R9: { fallback: 'envelope', iid: null, reason: 'unmapped-provider' },
	R10: { iid: 'int:isbn:9780140328721', rung: 'strong' },
	R11: { iid: 'int:wd:Q1', rung: 'strong' },
	R12: { iid: 'int:wd:film:Q1', rung: 'strong' },
};
// Each row is [direct, provider, movie/no-url, movie/url, album/no-url, album/url, book/no-url, book/url].
// 8 x 9 x 3 x 2 = 432 cells; E1 changes 48, E2 changes 8.
const EXPECTED_ROWS = [
	['none', 'none', 'R0', 'R1', 'R0', 'R1', 'R0', 'R1'],
	['none', 'isbn-same', 'R2', 'R2', 'R2', 'R2', 'R2', 'R2'],
	['none', 'isbn-different', 'R3', 'R3', 'R3', 'R3', 'R3', 'R3'],
	['none', 'wd-bare', 'R4', 'R4', 'R4', 'R4', 'R4', 'R4'],
	['none', 'wd-film', 'R5', 'R5', 'R5', 'R5', 'R5', 'R5'],
	['none', 'wd-human', 'R6', 'R6', 'R6', 'R6', 'R6', 'R6'],
	['none', 'int-wd-human', 'R7', 'R7', 'R7', 'R7', 'R7', 'R7'],
	['none', 'gtin', 'R8', 'R8', 'R0', 'R1', 'R8', 'R8'],
	['none', 'unknown', 'R9', 'R9', 'R9', 'R9', 'R9', 'R9'],
	['valid-isbn', 'none', 'R0', 'R1', 'R0', 'R1', 'R10', 'R10'],
	['valid-isbn', 'isbn-same', 'R2', 'R2', 'R2', 'R2', 'R10', 'R10'],
	['valid-isbn', 'isbn-different', 'R3', 'R3', 'R3', 'R3', 'R3', 'R3'],
	['valid-isbn', 'wd-bare', 'R4', 'R4', 'R4', 'R4', 'R10', 'R10'],
	['valid-isbn', 'wd-film', 'R5', 'R5', 'R5', 'R5', 'R10', 'R10'],
	['valid-isbn', 'wd-human', 'R6', 'R6', 'R6', 'R6', 'R10', 'R10'],
	['valid-isbn', 'int-wd-human', 'R7', 'R7', 'R7', 'R7', 'R10', 'R10'],
	['valid-isbn', 'gtin', 'R8', 'R8', 'R0', 'R1', 'R10', 'R10'],
	['valid-isbn', 'unknown', 'R9', 'R9', 'R9', 'R9', 'R10', 'R10'],
	['malformed-isbn', 'none', 'R0', 'R1', 'R0', 'R1', 'R0', 'R1'],
	['malformed-isbn', 'isbn-same', 'R2', 'R2', 'R2', 'R2', 'R2', 'R2'],
	['malformed-isbn', 'isbn-different', 'R3', 'R3', 'R3', 'R3', 'R3', 'R3'],
	['malformed-isbn', 'wd-bare', 'R4', 'R4', 'R4', 'R4', 'R4', 'R4'],
	['malformed-isbn', 'wd-film', 'R5', 'R5', 'R5', 'R5', 'R5', 'R5'],
	['malformed-isbn', 'wd-human', 'R6', 'R6', 'R6', 'R6', 'R6', 'R6'],
	['malformed-isbn', 'int-wd-human', 'R7', 'R7', 'R7', 'R7', 'R7', 'R7'],
	['malformed-isbn', 'gtin', 'R8', 'R8', 'R0', 'R1', 'R8', 'R8'],
	['malformed-isbn', 'unknown', 'R9', 'R9', 'R9', 'R9', 'R9', 'R9'],
	['bare-wd', 'none', 'R0', 'R1', 'R11', 'R11', 'R0', 'R1'],
	['bare-wd', 'isbn-same', 'R2', 'R2', 'R11', 'R11', 'R2', 'R2'],
	['bare-wd', 'isbn-different', 'R3', 'R3', 'R11', 'R11', 'R3', 'R3'],
	['bare-wd', 'wd-bare', 'R4', 'R4', 'R11', 'R11', 'R4', 'R4'],
	['bare-wd', 'wd-film', 'R5', 'R5', 'R5', 'R5', 'R5', 'R5'],
	['bare-wd', 'wd-human', 'R6', 'R6', 'R6', 'R6', 'R6', 'R6'],
	['bare-wd', 'int-wd-human', 'R7', 'R7', 'R7', 'R7', 'R7', 'R7'],
	['bare-wd', 'gtin', 'R8', 'R8', 'R11', 'R11', 'R8', 'R8'],
	['bare-wd', 'unknown', 'R9', 'R9', 'R11', 'R11', 'R9', 'R9'],
	['typed-film', 'none', 'R12', 'R12', 'R12', 'R12', 'R0', 'R1'],
	['typed-film', 'isbn-same', 'R12', 'R12', 'R12', 'R12', 'R2', 'R2'],
	['typed-film', 'isbn-different', 'R12', 'R12', 'R12', 'R12', 'R3', 'R3'],
	['typed-film', 'wd-bare', 'R12', 'R12', 'R12', 'R12', 'R4', 'R4'],
	['typed-film', 'wd-film', 'R5', 'R5', 'R5', 'R5', 'R5', 'R5'],
	['typed-film', 'wd-human', 'R12', 'R12', 'R12', 'R12', 'R0', 'R1'],
	['typed-film', 'int-wd-human', 'R12', 'R12', 'R12', 'R12', 'R0', 'R1'],
	['typed-film', 'gtin', 'R12', 'R12', 'R12', 'R12', 'R8', 'R8'],
	['typed-film', 'unknown', 'R12', 'R12', 'R12', 'R12', 'R9', 'R9'],
	['invalid-split', 'none', 'R12', 'R12', 'R12', 'R12', 'R0', 'R1'],
	['invalid-split', 'isbn-same', 'R12', 'R12', 'R12', 'R12', 'R2', 'R2'],
	['invalid-split', 'isbn-different', 'R12', 'R12', 'R12', 'R12', 'R3', 'R3'],
	['invalid-split', 'wd-bare', 'R12', 'R12', 'R12', 'R12', 'R4', 'R4'],
	['invalid-split', 'wd-film', 'R5', 'R5', 'R5', 'R5', 'R5', 'R5'],
	['invalid-split', 'wd-human', 'R12', 'R12', 'R12', 'R12', 'R0', 'R1'],
	['invalid-split', 'int-wd-human', 'R12', 'R12', 'R12', 'R12', 'R0', 'R1'],
	['invalid-split', 'gtin', 'R12', 'R12', 'R12', 'R12', 'R8', 'R8'],
	['invalid-split', 'unknown', 'R12', 'R12', 'R12', 'R12', 'R9', 'R9'],
	['redundant-alias', 'none', 'R12', 'R12', 'R11', 'R11', 'R0', 'R1'],
	['redundant-alias', 'isbn-same', 'R12', 'R12', 'R11', 'R11', 'R2', 'R2'],
	['redundant-alias', 'isbn-different', 'R12', 'R12', 'R11', 'R11', 'R3', 'R3'],
	['redundant-alias', 'wd-bare', 'R12', 'R12', 'R11', 'R11', 'R4', 'R4'],
	['redundant-alias', 'wd-film', 'R5', 'R5', 'R5', 'R5', 'R5', 'R5'],
	['redundant-alias', 'wd-human', 'R12', 'R12', 'R11', 'R11', 'R0', 'R1'],
	['redundant-alias', 'int-wd-human', 'R12', 'R12', 'R11', 'R11', 'R0', 'R1'],
	['redundant-alias', 'gtin', 'R12', 'R12', 'R11', 'R11', 'R8', 'R8'],
	['redundant-alias', 'unknown', 'R12', 'R12', 'R11', 'R11', 'R9', 'R9'],
	['conflicting-split', 'none', 'R0', 'R1', 'R0', 'R1', 'R0', 'R1'],
	['conflicting-split', 'isbn-same', 'R2', 'R2', 'R2', 'R2', 'R2', 'R2'],
	['conflicting-split', 'isbn-different', 'R3', 'R3', 'R3', 'R3', 'R3', 'R3'],
	['conflicting-split', 'wd-bare', 'R4', 'R4', 'R4', 'R4', 'R4', 'R4'],
	['conflicting-split', 'wd-film', 'R5', 'R5', 'R5', 'R5', 'R5', 'R5'],
	['conflicting-split', 'wd-human', 'R0', 'R1', 'R0', 'R1', 'R0', 'R1'],
	['conflicting-split', 'int-wd-human', 'R0', 'R1', 'R0', 'R1', 'R0', 'R1'],
	['conflicting-split', 'gtin', 'R8', 'R8', 'R0', 'R1', 'R8', 'R8'],
	['conflicting-split', 'unknown', 'R9', 'R9', 'R9', 'R9', 'R9', 'R9'],
] as const;

const CATEGORIES = ['movie', 'music-album', 'book'] as const;
const CELLS = EXPECTED_ROWS.flatMap(([direct, provider, ...codes]) =>
	CATEGORIES.flatMap((category, c) =>
		[false, true].map((url, u) => ({
			direct,
			provider,
			category,
			url,
			expected: RESULTS[codes[c * 2 + u] as string],
		}))
	)
);
describe('normalized reference differential grid', () => {
	it('covers all 432 distinct cells with an inline oracle', () => {
		expect(CELLS).toHaveLength(432);
		expect(
			new Set(
				CELLS.map(({ direct, provider, category, url }) =>
					[direct, provider, category, url].join('/')
				)
			).size
		).toBe(432);
	});
	it.each(CELLS)('$direct / $provider / $category / url=$url', ({
		direct,
		provider,
		category,
		url,
		expected,
	}) => {
		expect(
			projectIdentifierLadder({
				strongIdentifiers: DIRECTS[direct],
				providerCanonicalId: PROVIDERS[provider],
				strongIdentifierOrder: schemeOrderForIdentityCategory(category),
				allowPlainWd: category === 'music-album',
				canonicalUrl: url ? 'https://example.com/item' : undefined,
			})
		).toEqual(expected);
	});
});
