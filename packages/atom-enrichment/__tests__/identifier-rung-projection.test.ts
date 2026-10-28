import { describe, expect, test } from 'bun:test';
import {
	IDENTITY_RUNG_TOKENS,
	identityRungsForCategory,
	SCHEMA_TYPE_IDENTITY_CATEGORIES,
} from '@0xintuition/iid-ladder';
import type { MaterializedIdentityRungToken } from '../src/facet-registry';
import { normalizeResolvedClassificationInput } from '../src/handoff';
import { isIdentifierRungAllowed, projectIdentifierRungs } from '../src/identifier-rung-projection';
import { atomTypeSchema } from '../src/types';

test('re-derives artist identity solely from persisted sameAs evidence', () => {
	expect(
		projectIdentifierRungs({
			data: {
				'@type': 'MusicGroup',
				identifier: 'int:isni:0000000121367029',
				sameAs: [
					'https://musicbrainz.org/artist/5ae54dee-4dba-49c0-802a-a3b3b3adfe9b',
					'https://isni.org/isni/0000000121367029',
					'https://open.spotify.com/artist/69lxxQvsfAIoQbB20bEPFC',
					'https://wikidata.org/wiki/Q189729',
				],
			},
		})
	).toEqual([
		{ rung: 'isni', value: '0000000121367029' },
		{ rung: 'mbid:artist', value: 'artist:5ae54dee-4dba-49c0-802a-a3b3b3adfe9b' },
		{ rung: 'wd', value: 'Q189729' },
		{ rung: 'spotify:artist', value: '69lxxQvsfAIoQbB20bEPFC' },
	]);
	expect(
		projectIdentifierRungs({
			data: { '@type': 'MusicGroup', sameAs: ['https://isni.org/isni/0000000121367029'] },
		})
	).toEqual([{ rung: 'isni', value: '0000000121367029' }]);
});

test('re-derives album identity from sameAs and withholds ambiguous Spotify handles', () => {
	const sameAs = [
		'https://musicbrainz.org/release-group/e5b96d62-1414-337b-b0c3-28a6c5d5b65a',
		'https://open.spotify.com/album/0ETFjACtuP2ADo6LFhL6HN',
	];
	const mbid = {
		rung: 'mbid:release-group',
		value: 'release-group:e5b96d62-1414-337b-b0c3-28a6c5d5b65a',
	} as const;
	expect(projectIdentifierRungs({ data: { '@type': 'MusicAlbum', sameAs } })).toEqual([
		mbid,
		{ rung: 'spotify:album', value: '0ETFjACtuP2ADo6LFhL6HN' },
	]);
	expect(
		projectIdentifierRungs({
			data: {
				'@type': 'MusicAlbum',
				sameAs: [...sameAs, 'https://open.spotify.com/album/4uLU6hMCjMI75M1A2tKUQC'],
			},
		})
	).toEqual([mbid]);
});

test('projects the create-flow MusicGroup provider handle with Wikipedia first', () => {
	const value = '4uLU6hMCjMI75M1A2tKUQC';
	expect(
		projectIdentifierRungs({
			data: {
				'@type': 'MusicGroup',
				identifier: `int:spotify:artist:${value}`,
				name: 'Example artist',
				sameAs: [
					'https://en.wikipedia.org/wiki/Example_artist',
					`https://open.spotify.com/artist/${value}`,
				],
			},
		})
	).toEqual([{ rung: 'spotify:artist', value }]);
});

test('admits track and album projection independently', () => {
	const value = '4uLU6hMCjMI75M1A2tKUQC';
	expect(
		projectIdentifierRungs({
			data: {
				'@type': 'MusicRecording',
				identifier: `int:spotify:track:${value}`,
			},
		})
	).toEqual([{ rung: 'spotify:track', value }]);
	expect(
		projectIdentifierRungs({
			data: {
				'@type': 'MusicAlbum',
				identifier: `int:spotify:album:${value}`,
			},
		})
	).toEqual([{ rung: 'spotify:album', value }]);
});

describe('create bridge evidence readers', () => {
	test.each([
		[{ workOlid: 'OL45804W' }, 'OL45804W'],
		[{ editionOlid: 'OL7353617M' }, 'OL7353617M'],
		[{ workOlid: 'OL45804W', editionOlid: 'OL7353617M' }, 'OL45804W'],
	] as const)('reads Open Library keys: %j', (data, value) => {
		expect(projectIdentifierRungs({ schemaType: 'Book', data })).toEqual([{ rung: 'olid', value }]);
	});

	test.each(['sameAs', 'url'])('reads typed TMDB URLs from %s', (key) => {
		for (const [schemaType, kind] of [
			['Movie', 'movie'],
			['TVSeries', 'tv'],
		] as const) {
			const url = `https://www.themoviedb.org/${kind}/603`;
			expect(
				projectIdentifierRungs({ schemaType, data: { [key]: key === 'sameAs' ? [url] : url } })
			).toEqual([{ rung: `tmdb:${kind}`, value: '603' }]);
		}
	});

	test('does not reinterpret a TV URL or an unrelated host as a movie identifier', () => {
		expect(
			projectIdentifierRungs({
				schemaType: 'Movie',
				data: { sameAs: ['https://www.themoviedb.org/tv/603', 'https://example.com/movie/603'] },
			})
		).toEqual([]);
	});

	test('withholds conflicting typed TMDB URLs', () => {
		expect(
			projectIdentifierRungs({
				schemaType: 'Movie',
				data: {
					sameAs: ['https://www.themoviedb.org/movie/603', 'https://www.themoviedb.org/movie/604'],
				},
			})
		).toEqual([]);
	});

	test.each(['wd', 'wikidata'])('reads Wikidata bridge hint %s', (key) => {
		expect(
			projectIdentifierRungs({
				schemaType: 'Movie',
				data: {},
				evidence: [{ identifiers: { [key]: 'Q83495', wdSlug: 'film' } }],
			})
		).toEqual([{ rung: 'wd:film', value: 'Q83495' }]);
	});

	test('reads Goodreads and IMDb bridge hint keys', () => {
		expect(
			projectIdentifierRungs({
				schemaType: 'Book',
				data: {},
				evidence: [
					{ identifiers: { goodreadsBookId: '4671', olid: 'OL468431W', isbn: '9780743273565' } },
				],
			})
		).toEqual([
			{ rung: 'olid', value: 'OL468431W' },
			{ rung: 'isbn', value: '9780743273565' },
			{ rung: 'goodreads:book', value: '4671' },
		]);
		expect(
			projectIdentifierRungs({
				schemaType: 'Movie',
				data: {},
				evidence: [{ identifiers: { imdbId: 'tt0133093', tmdbId: '603', mediaType: 'movie' } }],
			})
		).toEqual([
			{ rung: 'tmdb:movie', value: '603' },
			{ rung: 'imdb:title', value: 'tt0133093' },
		]);
	});

	test('reads the typed Spotify track hint alongside ISRC', () => {
		expect(
			projectIdentifierRungs({
				schemaType: 'MusicRecording',
				data: {},
				evidence: [
					{ identifiers: { spotifyId: 'track:4uLU6hMCjMI75M1A2tKUQC', isrc: 'USRC17607839' } },
				],
			})
		).toEqual([
			{ rung: 'isrc', value: 'USRC17607839' },
			{ rung: 'spotify:track', value: '4uLU6hMCjMI75M1A2tKUQC' },
		]);
	});

	test('reads the Spotify classifier track key', () => {
		expect(
			projectIdentifierRungs({
				schemaType: 'MusicRecording',
				data: {},
				evidence: [{ identifiers: { spotifyTrackId: '4uLU6hMCjMI75M1A2tKUQC' } }],
			})
		).toEqual([{ rung: 'spotify:track', value: '4uLU6hMCjMI75M1A2tKUQC' }]);
	});
});

test.each(['sameAs', 'url'])('Book derives OL work from %s URL evidence', (key) => {
	const url = 'https://openlibrary.org/works/OL45804W';
	expect(
		projectIdentifierRungs({
			schemaType: 'Book',
			data: { isbn: '9780140328721', [key]: key === 'sameAs' ? [url] : url },
		})
	).toEqual([
		{ rung: 'olid', value: 'OL45804W' },
		{ rung: 'isbn', value: '9780140328721' },
	]);
});

type ProviderValueCase = {
	base: Record<string, unknown>;
	conflicting: readonly Record<string, unknown>[];
	malformed: readonly Record<string, unknown>[];
	name: string;
	rung: MaterializedIdentityRungToken;
	sourceFamily: string;
	valid: readonly Record<string, unknown>[];
	value: string;
};

describe('descriptive identifier rung category projection', () => {
	test('derives bridge TV rungs from TVSeries with explicit mediaType', () => {
		expect(
			projectIdentifierRungs({
				data: { '@type': 'TVSeries', identifier: 'int:wd:television-series:Q23572' },
				evidence: [{ mediaType: 'tv', tmdbId: 1399 }],
				sourceFamily: 'tmdb_or_imdb_tmdb_bridge',
			})
		).toContainEqual({ rung: 'tmdb:tv', value: '1399' });
	});

	test('derives bridge TV rungs from TVSeries without explicit mediaType', () => {
		const projected = projectIdentifierRungs({
			data: { '@type': 'TVSeries', identifier: 'int:wd:television-series:Q23572' },
			evidence: [{ tmdbId: 1399 }],
			sourceFamily: 'tmdb_or_imdb_tmdb_bridge',
		});

		expect(projected).toContainEqual({ rung: 'tmdb:tv', value: '1399' });
		expect(projected).not.toContainEqual({ rung: 'tmdb:movie', value: '1399' });
	});

	test('keeps bridge Movie rows on the movie policy', () => {
		expect(
			projectIdentifierRungs({
				data: { '@type': 'Movie', identifier: 'int:wd:film:Q184843' },
				evidence: [{ mediaType: 'movie', tmdbId: 603 }],
				sourceFamily: 'tmdb_or_imdb_tmdb_bridge',
			})
		).toEqual([
			{ rung: 'wd:film', value: 'Q184843' },
			{ rung: 'tmdb:movie', value: '603' },
		]);
	});
});

describe('provider-local identifier rung validation', () => {
	const cases: ProviderValueCase[] = [
		{
			base: { '@type': 'MusicRecording', identifier: 'int:isrc:USRC17607839' },
			conflicting: [
				{ spotifyId: '4uLU6hMCjMI75M1A2tKUQC' },
				{ spotifyId: '0VjIjW4GlUZAMYd2vXMi3b' },
			],
			malformed: [{ spotifyId: 'not a canonical spotify id' }],
			name: 'Spotify track',
			rung: 'spotify:track',
			sourceFamily: 'spotify_track',
			valid: [{ spotifyId: '4uLU6hMCjMI75M1A2tKUQC' }],
			value: '4uLU6hMCjMI75M1A2tKUQC',
		},
		{
			base: { '@type': 'Movie', identifier: 'int:imdb:tt0133093' },
			conflicting: [
				{ mediaType: 'movie', tmdbId: 603 },
				{ mediaType: 'movie', tmdbId: 604 },
			],
			malformed: [{ mediaType: 'movie', tmdbId: 0 }],
			name: 'TMDB movie',
			rung: 'tmdb:movie',
			sourceFamily: 'tmdb_movie',
			valid: [{ mediaType: 'movie', tmdbId: 603 }],
			value: '603',
		},
		{
			base: {
				'@type': 'PodcastSeries',
				identifier: 'int:podcastguid:f77016bc-fd74-5c94-893f-864deb06fc30',
			},
			conflicting: [{ podcastIndexId: 75_075 }, { podcastIndexId: 75_076 }],
			malformed: [{ podcastIndexId: '-1' }],
			name: 'Podcast Index',
			rung: 'podcast-index',
			sourceFamily: 'spotify_podcast_show',
			valid: [{ podcastIndexId: 75_075 }],
			value: '75075',
		},
		{
			base: { '@type': 'Book', identifier: 'int:olid:OL45883W' },
			conflicting: [{ goodreadsBookId: 13_3518 }, { goodreadsBookId: 13_3519 }],
			malformed: [{ goodreadsBookId: 'book-133518' }],
			name: 'Goodreads book',
			rung: 'goodreads:book',
			sourceFamily: 'goodreads_book',
			valid: [{ goodreadsBookId: 13_3518 }],
			value: '133518',
		},
	];

	for (const providerCase of cases) {
		test(`drops malformed ${providerCase.name} values`, () => {
			expect(
				projectIdentifierRungs({
					data: providerCase.base,
					evidence: providerCase.malformed,
					sourceFamily: providerCase.sourceFamily,
				})
			).not.toContainEqual(expect.objectContaining({ rung: providerCase.rung }));
		});

		test(`drops conflicting canonical ${providerCase.name} values`, () => {
			expect(
				projectIdentifierRungs({
					data: providerCase.base,
					evidence: providerCase.conflicting,
					sourceFamily: providerCase.sourceFamily,
				})
			).not.toContainEqual(expect.objectContaining({ rung: providerCase.rung }));
		});

		test(`passes one valid ${providerCase.name} value`, () => {
			expect(
				projectIdentifierRungs({
					data: providerCase.base,
					evidence: providerCase.valid,
					sourceFamily: providerCase.sourceFamily,
				})
			).toContainEqual({ rung: providerCase.rung, value: providerCase.value });
		});
	}
});

test('primary Wikidata identity wins over a neighbouring sameAs QID', () => {
	expect(
		projectIdentifierRungs({
			schemaType: 'Movie',
			existingIdentifier: 'int:wd:film:Q2346467',
			data: { sameAs: ['https://www.wikidata.org/wiki/Q122740297'] },
		})
	).toEqual([{ rung: 'wd:film', value: 'Q2346467' }]);
});
test('IMDb person is filtered before selecting the valid title', () => {
	expect(
		projectIdentifierRungs({
			schemaType: 'Movie',
			data: {
				sameAs: ['https://www.imdb.com/name/nm0000001', 'https://www.imdb.com/title/tt0073629'],
			},
		})
	).toEqual([{ rung: 'imdb:title', value: 'tt0073629' }]);
});
test('a rung-invalid IMDb person identity does not suppress the valid title candidate', () => {
	expect(
		projectIdentifierRungs({
			schemaType: 'Movie',
			existingIdentifier: 'int:imdb:nm0000001',
			data: { sameAs: ['https://www.imdb.com/title/tt0073629'] },
		})
	).toEqual([{ rung: 'imdb:title', value: 'tt0073629' }]);
});
test('a malformed OLID identity does not suppress the valid work candidate', () => {
	expect(
		projectIdentifierRungs({
			schemaType: 'Book',
			existingIdentifier: 'int:olid:OL1A',
			data: { sameAs: ['https://openlibrary.org/works/OL45804W'] },
		})
	).toEqual([{ rung: 'olid', value: 'OL45804W' }]);
});
test('distinct valid IMDb titles produce no alias', () => {
	expect(
		projectIdentifierRungs({
			schemaType: 'Movie',
			data: {
				sameAs: ['https://www.imdb.com/title/tt5330088', 'https://www.imdb.com/title/tt11718300'],
			},
		})
	).toEqual([]);
});

test('field contract distinguishes primary construction from exact alias matching', async () => {
	const source = await Bun.file(new URL('../src/data-resolved-schema.ts', import.meta.url)).text();
	expect(source).toContain('never constructs the primary iid');
	expect(source).toContain('alias matching');
});

test('every schema category admits exactly the ladder row', () => {
	const all = IDENTITY_RUNG_TOKENS;
	for (const [schemaType, category] of Object.entries(SCHEMA_TYPE_IDENTITY_CATEGORIES)) {
		expect(all.filter((rung) => isIdentifierRungAllowed(schemaType, rung))).toEqual(
			all.filter((rung) => identityRungsForCategory(category!).includes(rung))
		);
	}
});
test('Spotify album source family admits the ladder row without schema type', () => {
	const value = '4uLU6hMCjMI75M1A2tKUQC';
	expect(
		projectIdentifierRungs({
			data: { identifier: `int:spotify:album:${value}` },
			sourceFamily: 'spotify_album',
		})
	).toEqual([{ rung: 'spotify:album', value }]);
});

test('ladder categories remain compatible with the enrichment input vocabulary', () => {
	for (const [schemaType, category] of Object.entries(SCHEMA_TYPE_IDENTITY_CATEGORIES)) {
		const normalized = normalizeResolvedClassificationInput({
			resolved: { atoms: [{ schemaType, category: category!, title: 'Fixture' }] },
		});
		expect(atomTypeSchema.safeParse(normalized?.atomType).success).toBe(true);
	}
});

test('album projection excludes recording MBIDs', () => {
	expect(
		projectIdentifierRungs({
			schemaType: 'MusicAlbum',
			data: { identifier: 'int:mbid:recording:6b1b8f24-9d81-4b3a-8ad8-3791ae3e6c76' },
		})
	).toEqual([]);
});

test('FR2 feed GUID projection folds host case but preserves path and query case', () => {
	const project = (feedUrl: string) =>
		projectIdentifierRungs({ schemaType: 'PodcastSeries', data: { feedUrl } }).find(
			(row) => row.rung === 'podcastguid'
		)?.value;
	expect(project('https://FEEDS.EXAMPLE.ORG/podcast.xml')).toBe(
		project('https://feeds.example.org/podcast.xml')
	);
	expect(project('https://feeds.example.org/Podcast.xml')).not.toBe(
		project('https://feeds.example.org/podcast.xml')
	);
	expect(project('https://feeds.example.org/podcast.xml?Key=Value')).not.toBe(
		project('https://feeds.example.org/podcast.xml?key=value')
	);
});
