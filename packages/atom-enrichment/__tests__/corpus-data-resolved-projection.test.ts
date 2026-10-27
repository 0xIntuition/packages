import { describe, expect, test } from 'bun:test';

import {
	parseOpenLibraryProjectionPayload,
	projectCorpusDataResolvedFromArtifacts,
} from '../src/corpus-data-resolved-projection';

const wikipediaArtifact = (data: Record<string, unknown>) => ({
	artifactKind: 'wikipedia',
	data,
	stableKey: 'wikipedia-fixture',
	status: 'active',
});

const openLibraryArtifact = (data: Record<string, unknown>, stableKey = 'openlibrary-fixture') => ({
	artifactKind: 'openlibrary',
	data,
	stableKey,
	status: 'active',
});

const baseArticle = {
	'@context': 'https://schema.org/',
	'@type': 'Article',
	name: 'Projection fixture',
};
const baseBook = {
	'@context': 'https://schema.org/',
	'@type': 'Book',
	name: 'Projection fixture',
};

describe('Wikipedia corpus projection', () => {
	test('projects the real extract with normalized whitespace', () => {
		const projected = projectCorpusDataResolvedFromArtifacts({
			dataResolved: baseArticle,
			artifacts: [
				wikipediaArtifact({
					description: 'Short classification phrase',
					extract: '  A factual\n\nWikipedia extract\twith spacing.  ',
				}),
			],
		});

		expect(projected).toEqual({
			...baseArticle,
			description: 'A factual Wikipedia extract with spacing.',
		});
	});

	test('uses the established 320-character sentence-aware description cap', () => {
		const firstSentence = `${'A'.repeat(180)}.`;
		const projected = projectCorpusDataResolvedFromArtifacts({
			dataResolved: baseArticle,
			artifacts: [wikipediaArtifact({ extract: `${firstSentence} ${'B'.repeat(300)}.` })],
		}) as Record<string, unknown>;

		expect(projected.description).toBe(firstSentence);
		expect((projected.description as string).length).toBeLessThanOrEqual(320);
	});

	test('does nothing when Wikipedia description evidence is absent', () => {
		const projected = projectCorpusDataResolvedFromArtifacts({
			dataResolved: baseArticle,
			artifacts: [wikipediaArtifact({ title: 'Projection fixture' })],
		});

		expect(projected).toBe(baseArticle);
	});

	test('never overwrites a non-empty existing description', () => {
		const existing = { ...baseArticle, description: 'Existing source description.' };
		const projected = projectCorpusDataResolvedFromArtifacts({
			dataResolved: existing,
			artifacts: [wikipediaArtifact({ extract: 'Replacement extract.' })],
		});

		expect(projected).toBe(existing);
	});
});

describe('OpenLibrary corpus projection', () => {
	test('leaves a book with zero authors and zero subjects unchanged', () => {
		const projected = projectCorpusDataResolvedFromArtifacts({
			dataResolved: baseBook,
			artifacts: [openLibraryArtifact({ name: 'Projection fixture' })],
		});

		expect(projected).toBe(baseBook);
	});

	test('projects one author and synthesizes an author-only description', () => {
		const projected = projectCorpusDataResolvedFromArtifacts({
			dataResolved: baseBook,
			artifacts: [
				openLibraryArtifact({
					authors: [
						{
							olid: 'OL34184A',
							name: 'Roald Dahl',
							url: 'https://openlibrary.org/authors/OL34184A',
						},
					],
				}),
			],
		});

		expect(projected).toEqual({
			...baseBook,
			author: [
				{
					'@type': 'Person',
					identifier: 'OL34184A',
					name: 'Roald Dahl',
					url: 'https://openlibrary.org/authors/OL34184A',
				},
			],
			description: 'Book by Roald Dahl.',
		});
	});

	test('projects 2+ authors, stable subjects, and a bounded factual synthesis', () => {
		const projected = projectCorpusDataResolvedFromArtifacts({
			dataResolved: baseBook,
			artifacts: [
				openLibraryArtifact({
					authors: [
						{ olid: 'OL1A', name: 'First Author' },
						{ olid: 'OL2A', name: 'Second Author' },
						{ olid: 'OL3A', name: 'Third Author' },
					],
					subjects: ['Zoology', '  Art  History ', 'Biographies', 'Adventure', 'Ecology', 'Drama'],
				}),
			],
		}) as Record<string, unknown>;

		expect(projected.about).toEqual([
			'Adventure',
			'Art History',
			'Biographies',
			'Drama',
			'Ecology',
			'Zoology',
		]);
		expect(projected.description).toBe(
			'Book by First Author and Second Author. Subjects: Zoology, Art History, Biographies, Adventure, Ecology.'
		);
	});

	test('keeps catalogue tags structured but selects topical subjects in provider order', () => {
		const projected = projectCorpusDataResolvedFromArtifacts({
			dataResolved: baseBook,
			artifacts: [
				openLibraryArtifact({
					subjects: [
						'Accessible book',
						'Fantasy fiction',
						'In library',
						'Good and evil',
						'Large type books',
						'Open Library Staff Picks',
						'Overdrive',
						'Protected DAISY',
						'Apocalyptic fiction',
						'JUVENILE FICTION',
						'Juvenile fiction',
						'Comedy',
					],
				}),
			],
		}) as Record<string, unknown>;

		expect(projected.about).toContain('Accessible book');
		expect(projected.about).toContain('Open Library Staff Picks');
		expect(projected.about).toContain('Juvenile fiction');
		expect(projected.about).not.toContain('JUVENILE FICTION');
		expect(projected.description).toBe(
			'Subjects: Fantasy fiction, Good and evil, Apocalyptic fiction, Juvenile fiction, Comedy.'
		);
	});

	test('synthesizes a subject-only description when no author names exist', () => {
		const projected = projectCorpusDataResolvedFromArtifacts({
			dataResolved: baseBook,
			artifacts: [openLibraryArtifact({ subjects: ['History', 'Reference'] })],
		});

		expect(projected).toEqual({
			...baseBook,
			about: ['History', 'Reference'],
			description: 'Subjects: History, Reference.',
			keywords: ['History', 'Reference'],
		});
	});

	test('strips trailing punctuation from visible subjects and blocks punctuated catalogue tags', () => {
		const projected = projectCorpusDataResolvedFromArtifacts({
			dataResolved: baseBook,
			artifacts: [
				openLibraryArtifact({
					subjects: ['Juvenile fiction.', 'Animals, Fictional.', 'Accessible book.', 'In library.'],
				}),
			],
		}) as Record<string, unknown>;

		expect(projected.about).toContain('Accessible book.');
		expect(projected.description).toBe('Subjects: Juvenile fiction, Animals, Fictional.');
	});

	test('synthesizes from a classification-declared plain-string author', () => {
		const projected = projectCorpusDataResolvedFromArtifacts({
			dataResolved: { ...baseBook, author: 'Terry Pratchett' },
			artifacts: [openLibraryArtifact({ subjects: [] })],
		}) as Record<string, unknown>;

		expect(projected.description).toBe('Book by Terry Pratchett.');
	});

	test('uses a real OpenLibrary description before fallback synthesis', () => {
		const projected = projectCorpusDataResolvedFromArtifacts({
			dataResolved: baseBook,
			artifacts: [
				openLibraryArtifact({
					authors: [{ olid: 'OL1A', name: 'First Author' }],
					description: { value: '  Source-provided\nbook description. ' },
				}),
			],
		});

		expect(projected).toMatchObject({ description: 'Source-provided book description.' });
	});

	test('preserves an existing description while still filling structured fields', () => {
		const projected = projectCorpusDataResolvedFromArtifacts({
			dataResolved: { ...baseBook, description: 'Publisher description.' },
			artifacts: [
				openLibraryArtifact({
					authors: [{ olid: 'OL1A', name: 'First Author' }],
					subjects: ['History'],
				}),
			],
		});

		expect(projected).toMatchObject({
			about: ['History'],
			description: 'Publisher description.',
		});
	});

	test('standardizes existing author and about fields from provider evidence', () => {
		const projected = projectCorpusDataResolvedFromArtifacts({
			dataResolved: {
				...baseBook,
				about: ['Stale subject'],
				author: 'Stale author',
				description: 'Existing description.',
			},
			artifacts: [
				openLibraryArtifact({
					authors: [{ olid: 'OL1A', name: 'First Author' }],
					subjects: ['History'],
				}),
			],
		});

		expect(projected).toMatchObject({
			about: ['History'],
			author: [
				{
					'@type': 'Person',
					identifier: 'OL1A',
					name: 'First Author',
					url: 'https://openlibrary.org/authors/OL1A',
				},
			],
			description: 'Existing description.',
		});
	});

	test('parses raw payload authors in record order and joins their names', () => {
		const payload = JSON.stringify({
			authors: [
				{ key: '/authors/OL1A', name: 'Neil Gaiman' },
				{ key: '/authors/OL2A', name: 'Terry Pratchett' },
			],
			record: {
				authors: [{ author: { key: '/authors/OL2A' } }, { author: { key: '/authors/OL1A' } }],
				subjects: ['Juvenile fiction', 'Animals'],
			},
		});

		expect(parseOpenLibraryProjectionPayload(payload)).toBeDefined();
		expect(
			projectCorpusDataResolvedFromArtifacts({
				dataResolved: baseBook,
				artifacts: [],
				openLibraryPayloadJson: payload,
			})
		).toEqual({
			...baseBook,
			about: ['Animals', 'Juvenile fiction'],
			author: [
				{
					'@type': 'Person',
					identifier: 'OL2A',
					name: 'Terry Pratchett',
					url: 'https://openlibrary.org/authors/OL2A',
				},
				{
					'@type': 'Person',
					identifier: 'OL1A',
					name: 'Neil Gaiman',
					url: 'https://openlibrary.org/authors/OL1A',
				},
			],
			description: 'Book by Terry Pratchett and Neil Gaiman. Subjects: Juvenile fiction, Animals.',
		});
	});

	test('is byte-deterministic for equivalent artifact ordering', () => {
		const artifacts = [
			openLibraryArtifact(
				{ authors: [{ olid: 'OL2A', name: 'Second Author' }], subjects: ['Zoology'] },
				'b'
			),
			openLibraryArtifact(
				{ authors: [{ olid: 'OL1A', name: 'First Author' }], subjects: ['Art'] },
				'a'
			),
		];
		const first = projectCorpusDataResolvedFromArtifacts({
			dataResolved: baseBook,
			artifacts,
		});
		const second = projectCorpusDataResolvedFromArtifacts({
			dataResolved: baseBook,
			artifacts: [...artifacts].reverse(),
		});

		expect(JSON.stringify(second)).toBe(JSON.stringify(first));
	});
});

describe('provider facet promotion maps', () => {
	test('promotes mapped TMDB movie fields and never guesses an unmapped genre', () => {
		const projected = projectCorpusDataResolvedFromArtifacts({
			dataResolved: { '@type': 'Movie', name: 'Fixture Movie' },
			artifacts: [
				{
					artifactKind: 'tmdb',
					stableKey: 'tmdb-movie-603',
					status: 'active',
					data: {
						keywords: ['simulation', 'cyberpunk'],
						mediaType: 'movie',
						runtime: 136,
						tmdbApiPayload: {
							credits: {
								cast: [{ name: 'Keanu Reeves', order: 0 }],
								crew: [{ job: 'Director', name: 'Lana Wachowski' }],
							},
							genres: [
								{ id: 878, name: 'Science Fiction' },
								{ id: 999_999, name: 'Unreviewed' },
							],
							production_countries: [{ iso_3166_1: 'US' }],
							spoken_languages: [{ iso_639_1: 'en' }],
							vote_average: 8.2,
							vote_count: 25_000,
						},
					},
				},
			],
		}) as Record<string, unknown>;

		expect(projected).toMatchObject({
			actor: ['Keanu Reeves'],
			aggregateRating: { bestRating: 10, ratingCount: 25_000, ratingValue: 8.2 },
			countryOfOrigin: ['US'],
			director: ['Lana Wachowski'],
			duration: 'PT136M',
			// INTERIM (JP ruling 2026-09-17): display names, not crosswalk QIDs;
			// the unmapped "Unreviewed" entry is still dropped, never guessed.
			genre: ['Science Fiction'],
			inLanguage: ['en'],
			keywords: ['simulation', 'cyberpunk'],
		});
		expect(JSON.stringify(projected)).not.toContain('Unreviewed');
	});

	test('does not invent a TMDB rating or scale when vote_average is absent', () => {
		const projected = projectCorpusDataResolvedFromArtifacts({
			dataResolved: { '@type': 'TVSeries', name: 'Fixture Show' },
			artifacts: [
				{
					artifactKind: 'tmdb',
					status: 'active',
					data: { mediaType: 'tv', tmdbApiPayload: { vote_count: 123 } },
				},
			],
		}) as Record<string, unknown>;
		expect(projected.aggregateRating).toBeUndefined();
		expect(projected.bestRating).toBeUndefined();
	});

	test('keeps raw book and music vocabularies in keywords only', () => {
		const book = projectCorpusDataResolvedFromArtifacts({
			dataResolved: { '@type': 'Book', name: 'Fixture Book' },
			artifacts: [openLibraryArtifact({ subjects: ['Science fiction', 'Space opera'] })],
		}) as Record<string, unknown>;
		const song = projectCorpusDataResolvedFromArtifacts({
			dataResolved: { '@type': 'MusicRecording', name: 'Fixture Song' },
			artifacts: [
				{
					artifactKind: 'spotify',
					data: { durationMs: 201_500, genres: ['Synthwave'] },
					status: 'active',
				},
			],
		}) as Record<string, unknown>;

		expect(book.keywords).toEqual(['Science fiction', 'Space opera']);
		expect(book.genre).toBeUndefined();
		expect(song).toMatchObject({ duration: 'PT201.5S', keywords: ['Synthwave'] });
		expect(song.genre).toBeUndefined();
	});

	test('bounds provider arrays before the final data_resolved schema gate', () => {
		const projected = projectCorpusDataResolvedFromArtifacts({
			dataResolved: { '@type': 'MusicRecording', name: 'Fixture Song' },
			artifacts: [
				{
					artifactKind: 'spotify',
					data: {
						genres: [
							...Array.from({ length: 70 }, (_, index) => `Keyword ${index}`),
							'x'.repeat(129),
						],
					},
					status: 'active',
				},
			],
		}) as Record<string, unknown>;

		expect(projected.keywords).toHaveLength(64);
		expect(projected.keywords).not.toContain('x'.repeat(129));
	});
});
