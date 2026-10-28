import { z } from 'zod/v4';

// Twitter answers `height: null` for a tweet (observed live): a null dimension is simply absent.
const numericResponseSchema = z.union([z.number(), z.string()]).nullish();

export const oembedResponseSchema = z
	.object({
		type: z.enum(['photo', 'video', 'link', 'rich']),
		title: z.string().optional(),
		author_name: z.string().optional(),
		author_url: z.string().optional(),
		provider_name: z.string().optional(),
		provider_url: z.string().optional(),
		thumbnail_url: z.string().optional(),
		thumbnail_width: numericResponseSchema,
		thumbnail_height: numericResponseSchema,
		html: z.string().optional(),
		width: numericResponseSchema,
		height: numericResponseSchema,
		url: z.string().optional(),
	})
	.passthrough();

export type OEmbedResponse = z.infer<typeof oembedResponseSchema>;
