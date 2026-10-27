import { z } from 'zod/v4';

export const opengraphDataSchema = z.object({
	title: z.string().optional(),
	description: z.string().optional(),
	image: z.string().url().optional(),
	image_any: z.string().url().optional(),
	image_any_checked_at: z.string().optional(),
	image_any_license: z.record(z.string(), z.unknown()).optional(),
	url: z.string().url().optional(),
	siteName: z.string().optional(),
	type: z.string().optional(),
	locale: z.string().optional(),
	audio: z.string().url().optional(),
	audioUrl: z.string().url().optional(),
	audioType: z.string().optional(),
});

export type OpenGraphData = z.infer<typeof opengraphDataSchema>;
