import { z } from 'zod/v4';

const tmdbGenreResponseSchema = z
	.object({
		id: z.number().int().positive().optional(),
		name: z.string().min(1),
	})
	.passthrough();

const tmdbLanguageResponseSchema = z
	.object({
		english_name: z.string().optional(),
		iso_639_1: z.string().optional(),
		name: z.string().optional(),
	})
	.passthrough();

const tmdbCountryResponseSchema = z
	.object({
		iso_3166_1: z.string().optional(),
		name: z.string().optional(),
	})
	.passthrough();

const tmdbCreditResponseSchema = z
	.object({
		cast_id: z.number().int().optional(),
		character: z.string().optional(),
		credit_id: z.string().optional(),
		id: z.number().int().positive(),
		name: z.string().min(1),
		order: z.number().int().nonnegative().optional(),
		original_name: z.string().optional(),
		profile_path: z.string().nullable().optional(),
	})
	.passthrough();

const tmdbKeywordResponseSchema = z
	.object({
		id: z.number().int().positive(),
		name: z.string().min(1),
	})
	.passthrough();

const tmdbExternalIdsResponseSchema = z
	.object({
		imdb_id: z.string().nullable().optional(),
		tvdb_id: z.number().int().positive().nullable().optional(),
		wikidata_id: z.string().nullable().optional(),
	})
	.passthrough();

// min(1) alone admits whitespace-only strings; required identity fields must
// carry non-whitespace content or the entry is unusable.
const nonBlankString = z
	.string()
	.refine((value) => value.trim().length > 0, 'must contain non-whitespace characters');

const tmdbCollectionPartResponseSchema = z
	.object({
		id: z.number().int().positive(),
		media_type: nonBlankString.optional(),
		release_date: z.string().nullable().optional(),
		title: nonBlankString,
	})
	.passthrough();

export const tmdbCollectionResponseSchema = z
	.object({
		backdrop_path: z.string().nullable(),
		id: z.number().int().positive(),
		name: nonBlankString,
		overview: z.string().nullable(),
		parts: z.array(tmdbCollectionPartResponseSchema),
		poster_path: z.string().nullable(),
	})
	.passthrough();

const tmdbVideoEntryResponseSchema = z
	.object({
		id: z.string().min(1).optional(),
		iso_3166_1: z.string().nullable().optional(),
		iso_639_1: z.string().nullable().optional(),
		key: nonBlankString,
		name: z.string().optional(),
		official: z.boolean().optional(),
		published_at: z.string().optional(),
		site: nonBlankString,
		size: z.number().int().nonnegative().optional(),
		type: nonBlankString,
	})
	.passthrough();

export const tmdbVideosResponseSchema = z
	.object({ results: z.array(tmdbVideoEntryResponseSchema) })
	.passthrough();

export const tmdbDetailsResponseSchema = z
	.object({
		id: z.number().int().positive(),
		title: z.string().optional(),
		name: z.string().optional(),
		overview: z.string().nullable().optional(),
		poster_path: z.string().nullable().optional(),
		backdrop_path: z.string().nullable().optional(),
		release_date: z.string().nullable().optional(),
		first_air_date: z.string().nullable().optional(),
		vote_average: z.number().nullable().optional(),
		vote_count: z.number().int().nonnegative().optional(),
		genres: z.array(tmdbGenreResponseSchema).optional(),
		runtime: z.number().nonnegative().nullable().optional(),
		episode_run_time: z.array(z.number().nonnegative()).optional(),
		original_language: z.string().nullable().optional(),
		spoken_languages: z.array(tmdbLanguageResponseSchema).optional(),
		production_countries: z.array(tmdbCountryResponseSchema).optional(),
		imdb_id: z.string().nullable().optional(),
		credits: z
			.object({ cast: z.array(tmdbCreditResponseSchema).optional() })
			.passthrough()
			.optional(),
		keywords: z
			.object({
				keywords: z.array(tmdbKeywordResponseSchema).optional(),
				results: z.array(tmdbKeywordResponseSchema).optional(),
			})
			.passthrough()
			.optional(),
		external_ids: tmdbExternalIdsResponseSchema.optional(),
		release_dates: z.unknown().optional(),
		content_ratings: z.unknown().optional(),
	})
	.passthrough()
	.superRefine((payload, context) => {
		if (!(payload.title?.trim() || payload.name?.trim())) {
			context.addIssue({ code: 'custom', message: 'TMDB response requires title or name.' });
		}
	});

export type TmdbDetailsResponse = z.infer<typeof tmdbDetailsResponseSchema>;
export type TmdbCollectionResponse = z.infer<typeof tmdbCollectionResponseSchema>;
