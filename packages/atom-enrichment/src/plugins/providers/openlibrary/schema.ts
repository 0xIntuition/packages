import { z } from 'zod/v4';

export const openLibraryCoverImageUrlsSchema = z
	.object({
		small: z.string().url(),
		medium: z.string().url(),
		large: z.string().url(),
	})
	.strict();

export const openLibraryAuthorReferenceSchema = z
	.object({
		olid: z.string(),
		name: z.string().optional(),
		url: z.string().url(),
	})
	.strict();

export const openLibraryIdentifiersSchema = z
	.object({
		workOlid: z.string().optional(),
		editionOlid: z.string().optional(),
		authorOlids: z.array(z.string()).optional(),
		isbn10: z.array(z.string()).optional(),
		isbn13: z.array(z.string()).optional(),
		oclc: z.array(z.string()).optional(),
		lccn: z.array(z.string()).optional(),
	})
	.strict();

export const openLibrarySchemaOrgAuthorSchema = z
	.object({
		'@type': z.literal('Person'),
		identifier: z.string(),
		name: z.string().optional(),
		url: z.string().url(),
	})
	.strict();

export const openLibrarySchemaOrgBookSchema = z
	.object({
		'@context': z.literal('https://schema.org'),
		'@type': z.literal('Book'),
		name: z.string(),
		url: z.string().url(),
		author: z.array(openLibrarySchemaOrgAuthorSchema).optional(),
		datePublished: z.string().optional(),
		description: z.string().optional(),
		image: z.string().url().optional(),
		isbn: z.array(z.string()).optional(),
		sameAs: z.array(z.string().url()).optional(),
	})
	.strict();

export const openLibraryDataSchema = z
	.object({
		entityType: z.enum(['work', 'edition']),
		sourceKind: z.enum(['work', 'edition', 'isbn']),
		openLibraryUrl: z.string().url(),
		workUrl: z.string().url().optional(),
		editionUrl: z.string().url().optional(),
		workOlid: z.string().optional(),
		editionOlid: z.string().optional(),
		title: z.string(),
		subtitle: z.string().optional(),
		name: z.string(),
		description: z.string().optional(),
		subjects: z.array(z.string()).optional(),
		authors: z.array(openLibraryAuthorReferenceSchema).optional(),
		firstPublishDate: z.string().optional(),
		publishDate: z.string().optional(),
		publishers: z.array(z.string()).optional(),
		coverId: z.number().int().positive().optional(),
		coverImageUrls: openLibraryCoverImageUrlsSchema.optional(),
		authorOlids: z.array(z.string()).optional(),
		isbn10: z.array(z.string()).optional(),
		isbn13: z.array(z.string()).optional(),
		oclc: z.array(z.string()).optional(),
		lccn: z.array(z.string()).optional(),
		identifiers: openLibraryIdentifiersSchema.optional(),
		schemaOrg: openLibrarySchemaOrgBookSchema,
	})
	.strict();

export type OpenLibraryAuthorReference = z.infer<typeof openLibraryAuthorReferenceSchema>;
export type OpenLibraryCoverImageUrls = z.infer<typeof openLibraryCoverImageUrlsSchema>;
export type OpenLibraryData = z.infer<typeof openLibraryDataSchema>;
export type OpenLibraryIdentifiers = z.infer<typeof openLibraryIdentifiersSchema>;
export type OpenLibrarySchemaOrgBook = z.infer<typeof openLibrarySchemaOrgBookSchema>;
