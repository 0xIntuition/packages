import { z } from 'zod/v4';

export const steamAppDetailsResponseSchema = z.record(
	z.string(),
	z
		.object({
			success: z.boolean().optional(),
			data: z.record(z.string(), z.unknown()).optional(),
		})
		.passthrough()
);

export type SteamAppDetailsResponse = z.infer<typeof steamAppDetailsResponseSchema>;
