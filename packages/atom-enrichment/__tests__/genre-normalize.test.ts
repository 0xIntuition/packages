import { describe, expect, test } from 'bun:test';

import {
	type CrosswalkData,
	canonicalizeGenre,
	expandGenre,
	type GenreCategory,
	normalizeGenre,
} from '../src/normalize/genre';
import { AMBIGUOUS, TMDB_GENRES } from '../src/normalize/mappings/tmdb-genres';

const FIXTURE_DIRECTORY = new URL('./__fixtures__/genre-normalize/', import.meta.url);

const parseCsv = async (name: string): Promise<string[][]> => {
	const contents = await Bun.file(new URL(name, FIXTURE_DIRECTORY)).text();
	return contents
		.trim()
		.split(/\r?\n/u)
		.slice(1)
		.map((line) => line.split(','));
};

async function fixtureData(): Promise<CrosswalkData> {
	const [labelValues, hierarchyValues] = await Promise.all([
		parseCsv('genre-labels.csv'),
		parseCsv('genre-p279-ancestors.csv'),
	]);
	return {
		bandExclusions: [
			{ ancestor_qid: 'Q17537576', reason: 'overly broad creative-work root' },
			{ ancestor_qid: 'Q35120', reason: 'overly broad entity root' },
		],
		categoryQids: {
			book: ['Q17537576', 'Q2254211'],
			movie: ['Q130232'],
			'tv-series': ['Q1366112'],
		},
		hierarchyRows: hierarchyValues.map((row) => ({
			ancestor_label_en: row[2] || null,
			ancestor_qid: requiredCell(row, 1),
			genre_qid: requiredCell(row, 0),
		})),
		labelRows: labelValues.map((row) => ({
			genre_qid: requiredCell(row, 0),
			label_en: requiredCell(row, 1),
		})),
	};
}

function requiredCell(row: string[], index: number): string {
	const value = row[index];
	if (!value) throw new Error(`Fixture row is missing column ${index}.`);
	return value;
}

describe('genre canonicalization', () => {
	const cases: Array<[GenreCategory, string, string]> = [
		['movie', '  Science FICTION  ', 'science fiction'],
		['movie', 'Action/Adventure', 'action adventure'],
		['book', 'Children’s—Fiction', 'children s fiction'],
		['song', 'R&B', 'r b'],
		['podcast-series', 'True.Crime', 'true crime'],
	];

	test.each(cases)('%s folds %s to %s', (category, input, expected) => {
		expect(canonicalizeGenre(category, input)).toBe(expected);
	});

	test('applies aliases within the requested category', () => {
		expect(canonicalizeGenre('movie', 'sci-fi')).toBe('science fiction');
		expect(canonicalizeGenre('tv-series', 'sci-fi & fantasy')).toBe('science fiction fantasy');
		expect(canonicalizeGenre('song', 'sci-fi')).toBe('sci fi');
	});
});

describe('normalizeGenre', () => {
	test('uses a category-appropriate explicit source mapping', async () => {
		const data = await fixtureData();
		expect(
			normalizeGenre({ category: 'movie', rawValue: ' SCI-FI ', source: 'TMDB' }, data)
		).toEqual({ canonical: 'science fiction', qid: 'Q471839', status: 'mapped' });
		expect(
			normalizeGenre({ category: 'tv-series', rawValue: 'Drama', source: 'tmdb' }, data)
		).toEqual({ canonical: 'drama', qid: 'Q1366112', status: 'mapped' });
	});

	test('falls back to a unique canonical label match', async () => {
		const data = await fixtureData();
		expect(
			normalizeGenre(
				{ category: 'book', rawValue: 'Political Fiction', source: 'openlibrary' },
				data
			)
		).toEqual({ canonical: 'political fiction', qid: 'Q2254211', status: 'mapped' });
	});

	test.each([
		['tv-series', 'drama film'],
		['movie', 'drama television series'],
	] as const)('does not leak the %s label spine for %s', async (category, rawValue) => {
		const data = await fixtureData();
		expect(normalizeGenre({ category, rawValue, source: 'wikidata' }, data)).toEqual({
			canonical: rawValue,
			status: 'unknown',
		});
	});

	test('keeps unknowns as data and never guesses a colliding label', async () => {
		const data = await fixtureData();
		expect(
			normalizeGenre({ category: 'movie', rawValue: 'Neo-Noir-ish', source: 'tmdb' }, data)
		).toEqual({ canonical: 'neo noir ish', status: 'unknown' });

		const duplicateLabels: CrosswalkData = {
			...data,
			categoryQids: {
				...data.categoryQids,
				book: [...(data.categoryQids.book ?? []), 'Q999999'],
			},
			labelRows: [...data.labelRows, { genre_qid: 'Q999999', label_en: 'political fiction' }],
		};
		expect(
			normalizeGenre(
				{ category: 'book', rawValue: 'Political Fiction', source: 'openlibrary' },
				duplicateLabels
			)
		).toEqual({ canonical: 'political fiction', status: 'unknown' });
		const combinedLabelData: CrosswalkData = {
			...data,
			labelRows: [...data.labelRows, { genre_qid: 'Q999998', label_en: 'science fiction fantasy' }],
		};
		expect(
			normalizeGenre(
				{ category: 'tv-series', rawValue: 'Sci-Fi & Fantasy', source: 'tmdb' },
				combinedLabelData
			)
		).toEqual({ canonical: 'science fiction fantasy', status: 'unknown' });
	});

	test('returns band exclusions explicitly', async () => {
		const data = await fixtureData();
		expect(
			normalizeGenre({ category: 'book', rawValue: 'Creative Work', source: 'wikidata' }, data)
		).toEqual({
			qid: 'Q17537576',
			reason: 'overly broad creative-work root',
			status: 'excluded',
		});
	});

	test('is deterministic for identical inputs and data', async () => {
		const data = await fixtureData();
		const input = { category: 'movie' as const, rawValue: 'Mystery', source: 'tmdb' };
		expect(normalizeGenre(input, data)).toEqual(normalizeGenre(input, data));
	});
});

describe('TMDB mappings', () => {
	test('covers all 19 movie genres and all 16 TV genres without guessing combined genres', () => {
		const mappedMovieRows = TMDB_GENRES.filter(({ category }) => category === 'movie');
		const mappedTvRows = TMDB_GENRES.filter(({ category }) => category === 'tv-series');
		const ambiguousTvRows = AMBIGUOUS.filter(({ category }) => category === 'tv-series');

		expect(mappedMovieRows).toHaveLength(19);
		expect(mappedTvRows).toHaveLength(14);
		expect(ambiguousTvRows).toHaveLength(2);
		expect(mappedMovieRows).toHaveLength(19);
		expect(mappedTvRows.length + ambiguousTvRows.length).toBe(16);
	});

	test('backs every mapping and ambiguity candidate with the expected fixture label', async () => {
		const data = await fixtureData();
		const labels = new Map(data.labelRows.map(({ genre_qid, label_en }) => [genre_qid, label_en]));
		const expectedLabels = new Map([
			['Q188473', 'action film'],
			['Q319221', 'adventure film'],
			['Q202866', 'animated film'],
			['Q157443', 'comedy film'],
			['Q959790', 'crime film'],
			['Q93204', 'documentary film'],
			['Q130232', 'drama film'],
			['Q1361932', 'family film'],
			['Q157394', 'fantasy film'],
			['Q17013749', 'historical film'],
			['Q200092', 'horror film'],
			['Q109733358', 'music-themed film'],
			['Q1200678', 'mystery film'],
			['Q1054574', 'romance film'],
			['Q471839', 'science fiction film'],
			['Q506240', 'television film'],
			['Q2484376', 'thriller film'],
			['Q369747', 'war film'],
			['Q172980', 'Western film'],
			['Q110593091', 'action and adventure television program'],
			['Q117467246', 'animated television series'],
			['Q9335576', 'comedy television series'],
			['Q9335577', 'crime television series'],
			['Q133731271', 'documentary television series'],
			['Q1366112', 'drama television series'],
			['Q178840', 'family television series'],
			['Q1273568', "children's television series"],
			['Q101898470', 'mystery television series'],
			['Q1358344', 'news program'],
			['Q21232614', 'reality television series'],
			['Q23739', 'soap opera'],
			['Q622812', 'talk show'],
			['Q7988576', 'Westerns on television'],
		]);

		for (const mapping of TMDB_GENRES) {
			expect(labels.get(mapping.qid)).toBe(expectedLabels.get(mapping.qid));
		}
		for (const ambiguous of AMBIGUOUS) {
			for (const candidate of ambiguous.candidates) {
				expect(labels.get(candidate.qid)).toBe(candidate.wikidataLabelEn);
			}
		}
	});
});

describe('expandGenre', () => {
	test('returns self and transitive ancestors minus excluded bands', async () => {
		const data = await fixtureData();
		expect([...expandGenre('Q20656232', data)]).toEqual([
			'Q188473',
			'Q20656232',
			'Q24925',
			'Q471839',
		]);
	});

	test('returns the same unsorted sequence for hierarchy row permutations', async () => {
		const data = await fixtureData();
		const firstHierarchyRow = data.hierarchyRows[0];
		if (!firstHierarchyRow) throw new Error('Expected hierarchy fixture rows.');
		const permutations = [
			data.hierarchyRows,
			[...data.hierarchyRows].reverse(),
			[...data.hierarchyRows.slice(1), firstHierarchyRow],
		];
		const sequences = permutations.map((hierarchyRows) => [
			...expandGenre('Q20656232', { ...data, hierarchyRows }),
		]);

		expect(sequences[1]).toEqual(sequences[0]);
		expect(sequences[2]).toEqual(sequences[0]);
	});

	test('is cycle-safe and keeps only self for an unknown QID', async () => {
		const data = await fixtureData();
		const cyclic: CrosswalkData = {
			...data,
			hierarchyRows: [
				...data.hierarchyRows,
				{ ancestor_label_en: 'cycle b', ancestor_qid: 'Q900002', genre_qid: 'Q900001' },
				{ ancestor_label_en: 'cycle a', ancestor_qid: 'Q900001', genre_qid: 'Q900002' },
			],
		};
		expect(expandGenre('Q900001', cyclic)).toEqual(new Set(['Q900001', 'Q900002']));
		expect(expandGenre('Q999999', data)).toEqual(new Set(['Q999999']));
	});
});
