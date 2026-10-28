import { z } from 'zod/v4';

export const openLibraryEntityResponseSchema = z
	.object({
		key: z.string().optional(),
		title: z.string().optional(),
	})
	.passthrough();

export const openLibraryAuthorResponseSchema = z
	.object({
		key: z.string().optional(),
		name: z.string().optional(),
		personal_name: z.string().optional(),
	})
	.passthrough();

export const openLibraryEditionsResponseSchema = z
	.object({
		entries: z.array(openLibraryEntityResponseSchema),
	})
	.passthrough();

export type OpenLibraryAuthorResponse = z.infer<typeof openLibraryAuthorResponseSchema>;
export type OpenLibraryEditionsResponse = z.infer<typeof openLibraryEditionsResponseSchema>;
export type OpenLibraryEntityResponse = z.infer<typeof openLibraryEntityResponseSchema>;
