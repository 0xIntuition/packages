import { z } from 'zod/v4';

const tvmazeDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const imdbIdSchema = z.string().regex(/^tt\d+$/);

export const tvmazeScheduleSchema = z
	.object({
		time: z.string(),
		days: z.array(z.string()),
	})
	.passthrough();

export const tvmazeNetworkSchema = z
	.object({
		name: z.string().min(1),
	})
	.passthrough();

export const tvmazeExternalsSchema = z
	.object({
		imdb: imdbIdSchema.nullish(),
		thetvdb: z.number().int().positive().nullish(),
		tvrage: z.number().int().positive().nullish(),
	})
	.passthrough();

export const tvmazeImageSchema = z
	.object({
		medium: z.string().url(),
		original: z.string().url(),
	})
	.passthrough();

export const tvmazeRatingSchema = z
	.object({
		average: z.number().min(0).max(10).nullable(),
	})
	.passthrough();

/**
 * TVmaze adds response fields over time. Passthrough keeps the acquired show
 * object lossless while the required provider contract remains fail-loud.
 */
export const tvmazeShowResponseSchema = z
	.object({
		id: z.number().int().positive(),
		url: z.string().url(),
		name: z.string().min(1),
		genres: z.array(z.string()),
		premiered: tvmazeDateSchema.nullish(),
		ended: tvmazeDateSchema.nullish(),
		status: z.string().min(1),
		network: tvmazeNetworkSchema.nullish(),
		webChannel: tvmazeNetworkSchema.nullish(),
		schedule: tvmazeScheduleSchema.nullish(),
		averageRuntime: z.number().nonnegative().nullish(),
		runtime: z.number().nonnegative().nullish(),
		language: z.string().min(1).nullish(),
		type: z.string().min(1),
		officialSite: z.string().url().nullish(),
		externals: tvmazeExternalsSchema.nullish(),
		image: tvmazeImageSchema.nullish(),
		summary: z.string().nullish(),
		rating: tvmazeRatingSchema.nullish(),
	})
	.passthrough();

const tvmazeArtifactNetworkSchema = z.object({ name: z.string().min(1) }).strict();
const tvmazeArtifactScheduleSchema = z
	.object({
		time: z.string(),
		days: z.array(z.string()),
	})
	.strict();
const tvmazeArtifactExternalsSchema = z
	.object({
		imdb: z.string().nullable(),
		thetvdb: z.number().int().positive().nullable(),
		tvrage: z.number().int().positive().nullable(),
	})
	.strict();
const tvmazeArtifactImageSchema = z
	.object({
		medium: z.string().url(),
		original: z.string().url(),
	})
	.strict();
const tvmazeArtifactRatingSchema = z
	.object({ average: z.number().min(0).max(10).nullable() })
	.strict();

export const tvmazeDataSchema = z
	.object({
		id: z.number().int().positive(),
		url: z.string().url(),
		name: z.string().min(1),
		genres: z.array(z.string()),
		premiered: tvmazeDateSchema.nullable(),
		ended: tvmazeDateSchema.nullable(),
		status: z.string().min(1),
		network: tvmazeArtifactNetworkSchema.nullable(),
		webChannel: tvmazeArtifactNetworkSchema.nullable(),
		schedule: tvmazeArtifactScheduleSchema,
		averageRuntime: z.number().nonnegative().nullable(),
		runtime: z.number().nonnegative().nullable(),
		language: z.string().min(1).nullable(),
		type: z.string().min(1),
		officialSite: z.string().url().nullable(),
		externals: tvmazeArtifactExternalsSchema,
		image: tvmazeArtifactImageSchema.nullable(),
		summary: z.string().nullable(),
		rating: tvmazeArtifactRatingSchema,
		tvmazeApiPayload: tvmazeShowResponseSchema,
	})
	.strict();

export type TvmazeShowResponse = z.infer<typeof tvmazeShowResponseSchema>;
export type TvmazeData = z.infer<typeof tvmazeDataSchema>;
