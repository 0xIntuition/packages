import { z } from 'zod/v4';
import { tmdbDetailsResponseSchema } from './external';

const identifierRungEntrySchema = z
	.object({
		scheme: z.enum(['imdb', 'tmdb']),
		value: z.string().min(1),
	})
	.strict();

const tmdbCreditSchema = z
	.object({
		character: z.string().optional(),
		creditId: z.string().optional(),
		id: z.number().int().positive(),
		name: z.string().min(1),
		order: z.number().int().nonnegative().optional(),
		profilePath: z.string().optional(),
	})
	.strict();

export const tmdbDataSchema = z
	.object({
		tmdbId: z.number().int().positive(),
		mediaType: z.enum(['movie', 'tv']),
		title: z.string().min(1),
		overview: z.string().optional(),
		posterPath: z.string().optional(),
		posterUrl: z.string().url().optional(),
		backdropPath: z.string().optional(),
		backdropUrl: z.string().url().optional(),
		releaseDate: z.string().optional(),
		voteAverage: z.number().optional(),
		voteCount: z.number().int().nonnegative().optional(),
		genres: z.array(z.string().min(1)),
		runtime: z.number().nonnegative().optional(),
		originalLanguage: z.string().optional(),
		spokenLanguages: z.array(z.string().min(1)),
		productionCountries: z.array(z.string().min(1)),
		keywords: z.array(z.string().min(1)),
		topBilledCredits: z.array(tmdbCreditSchema),
		imdbId: z
			.string()
			.regex(/^tt\d+$/)
			.optional(),
		tvdbId: z.number().int().positive().optional(),
		wikidataId: z
			.string()
			.regex(/^Q[1-9]\d*$/)
			.optional(),
		externalIds: z
			.object({
				imdbId: z
					.string()
					.regex(/^tt\d+$/)
					.optional(),
				tvdbId: z.number().int().positive().optional(),
				wikidataId: z
					.string()
					.regex(/^Q[1-9]\d*$/)
					.optional(),
			})
			.strict(),
		identifierRung: z.array(identifierRungEntrySchema).min(1).max(2),
		sameAs: z.array(z.string().url()).min(1).max(2),
		tmdbApiPayload: tmdbDetailsResponseSchema,
	})
	.strict();

export type TmdbData = z.infer<typeof tmdbDataSchema>;
