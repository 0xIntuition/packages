import { z } from 'zod/v4';

export const letterboxdDataSchema = z.object({
	title: z.string().min(1),
	description: z.string().min(1).optional(),
	image: z.string().url().optional(),
	year: z.number().int().min(1888).max(3000).optional(),
	directors: z.array(z.string().min(1)).optional(),
	rating: z.number().min(0).max(5).optional(),
	bestRating: z.literal(5).optional(),
	ratingCount: z.number().int().min(0).optional(),
	tmdbId: z
		.string()
		.regex(/^[1-9]\d*$/)
		.optional(),
});

export type LetterboxdData = z.infer<typeof letterboxdDataSchema>;
