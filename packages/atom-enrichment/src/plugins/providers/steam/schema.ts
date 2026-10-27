import { z } from 'zod/v4';

export const steamPriceOverviewSchema = z
	.object({
		currency: z.string().optional(),
		initial: z.number().optional(),
		final: z.number().optional(),
		discountPercent: z.number().optional(),
		finalFormatted: z.string().optional(),
	})
	.strict();

export const steamAppDataSchema = z
	.object({
		appId: z.number(),
		name: z.string(),
		type: z.string().optional(),
		steamUrl: z.string().url(),
		shortDescription: z.string().optional(),
		headerImage: z.string().url().optional(),
		capsuleImage: z.string().url().optional(),
		developers: z.array(z.string()).optional(),
		publishers: z.array(z.string()).optional(),
		releaseDate: z.string().optional(),
		comingSoon: z.boolean().optional(),
		genres: z.array(z.string()).optional(),
		categories: z.array(z.string()).optional(),
		platforms: z.array(z.string()).optional(),
		metacriticScore: z.number().optional(),
		recommendationsTotal: z.number().optional(),
		isFree: z.boolean().optional(),
		priceOverview: steamPriceOverviewSchema.optional(),
	})
	.strict();

export type SteamPriceOverview = z.infer<typeof steamPriceOverviewSchema>;
export type SteamAppData = z.infer<typeof steamAppDataSchema>;
