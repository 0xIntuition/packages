export type TmdbGenreCategory = 'movie' | 'tv-series';

export interface TmdbGenreMapping {
	readonly category: TmdbGenreCategory;
	readonly qid: string;
	readonly tmdbId: number;
	readonly tmdbName: string;
}

export interface AmbiguousTmdbGenreMapping {
	readonly candidates: ReadonlyArray<{
		readonly qid: string;
		readonly wikidataLabelEn: string;
	}>;
	readonly category: TmdbGenreCategory;
	readonly reason: string;
	readonly tmdbId: number;
	readonly tmdbName: string;
}

export const TMDB_GENRES = [
	{ category: 'movie', qid: 'Q188473', tmdbId: 28, tmdbName: 'Action' },
	{ category: 'movie', qid: 'Q319221', tmdbId: 12, tmdbName: 'Adventure' },
	{ category: 'movie', qid: 'Q202866', tmdbId: 16, tmdbName: 'Animation' },
	{ category: 'movie', qid: 'Q157443', tmdbId: 35, tmdbName: 'Comedy' },
	{ category: 'movie', qid: 'Q959790', tmdbId: 80, tmdbName: 'Crime' },
	{ category: 'movie', qid: 'Q93204', tmdbId: 99, tmdbName: 'Documentary' },
	{ category: 'movie', qid: 'Q130232', tmdbId: 18, tmdbName: 'Drama' },
	{ category: 'movie', qid: 'Q1361932', tmdbId: 10_751, tmdbName: 'Family' },
	{ category: 'movie', qid: 'Q157394', tmdbId: 14, tmdbName: 'Fantasy' },
	{ category: 'movie', qid: 'Q17013749', tmdbId: 36, tmdbName: 'History' },
	{ category: 'movie', qid: 'Q200092', tmdbId: 27, tmdbName: 'Horror' },
	{ category: 'movie', qid: 'Q109733358', tmdbId: 10_402, tmdbName: 'Music' },
	{ category: 'movie', qid: 'Q1200678', tmdbId: 9648, tmdbName: 'Mystery' },
	{ category: 'movie', qid: 'Q1054574', tmdbId: 10_749, tmdbName: 'Romance' },
	{ category: 'movie', qid: 'Q471839', tmdbId: 878, tmdbName: 'Science Fiction' },
	{ category: 'movie', qid: 'Q506240', tmdbId: 10_770, tmdbName: 'TV Movie' },
	{ category: 'movie', qid: 'Q2484376', tmdbId: 53, tmdbName: 'Thriller' },
	{ category: 'movie', qid: 'Q369747', tmdbId: 10_752, tmdbName: 'War' },
	{ category: 'movie', qid: 'Q172980', tmdbId: 37, tmdbName: 'Western' },
	{
		category: 'tv-series',
		qid: 'Q110593091',
		tmdbId: 10_759,
		tmdbName: 'Action & Adventure',
	},
	{ category: 'tv-series', qid: 'Q117467246', tmdbId: 16, tmdbName: 'Animation' },
	{ category: 'tv-series', qid: 'Q9335576', tmdbId: 35, tmdbName: 'Comedy' },
	{ category: 'tv-series', qid: 'Q9335577', tmdbId: 80, tmdbName: 'Crime' },
	{ category: 'tv-series', qid: 'Q133731271', tmdbId: 99, tmdbName: 'Documentary' },
	{ category: 'tv-series', qid: 'Q1366112', tmdbId: 18, tmdbName: 'Drama' },
	{ category: 'tv-series', qid: 'Q178840', tmdbId: 10_751, tmdbName: 'Family' },
	{ category: 'tv-series', qid: 'Q1273568', tmdbId: 10_762, tmdbName: 'Kids' },
	{ category: 'tv-series', qid: 'Q101898470', tmdbId: 9648, tmdbName: 'Mystery' },
	{ category: 'tv-series', qid: 'Q1358344', tmdbId: 10_763, tmdbName: 'News' },
	{ category: 'tv-series', qid: 'Q21232614', tmdbId: 10_764, tmdbName: 'Reality' },
	{ category: 'tv-series', qid: 'Q23739', tmdbId: 10_766, tmdbName: 'Soap' },
	{ category: 'tv-series', qid: 'Q622812', tmdbId: 10_767, tmdbName: 'Talk' },
	{ category: 'tv-series', qid: 'Q7988576', tmdbId: 37, tmdbName: 'Western' },
] as const satisfies readonly TmdbGenreMapping[];

export const AMBIGUOUS = [
	{
		candidates: [
			{ qid: 'Q140472311', wikidataLabelEn: 'science fiction television series' },
			{ qid: 'Q98526245', wikidataLabelEn: 'fantasy television series' },
		],
		category: 'tv-series',
		reason: 'TMDB combines two distinct Wikidata television-series genres.',
		tmdbId: 10_765,
		tmdbName: 'Sci-Fi & Fantasy',
	},
	{
		candidates: [
			{ qid: 'Q102245189', wikidataLabelEn: 'war television series' },
			{ qid: 'Q2254211', wikidataLabelEn: 'political fiction' },
		],
		category: 'tv-series',
		reason: 'TMDB combines war and political fiction without one equivalent Wikidata genre.',
		tmdbId: 10_768,
		tmdbName: 'War & Politics',
	},
] as const satisfies readonly AmbiguousTmdbGenreMapping[];
