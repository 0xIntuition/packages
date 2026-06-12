import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgBlog = {
	id: 'schema:Blog',
	name: 'Blog',
	label: 'Blog',
	comment:
		'A [blog](https://en.wikipedia.org/wiki/Blog), sometimes known as a "weblog". Note that the individual posts ([[BlogPosting]]s) in a [[Blog]] are often colloquially referred to by the same term.',
	subClassOf: ['CreativeWork', 'Thing'],
	properties: [
		{
			id: 'schema:blogPost',
			name: 'blogPost',
			label: 'blogPost',
			comment: 'A posting that is part of this blog.',
			rangeIncludes: ['BlogPosting'],
		},
		{
			id: 'schema:blogPosts',
			name: 'blogPosts',
			label: 'blogPosts',
			comment:
				'Indicates a post that is part of a [[Blog]]. Note that historically, what we term a "Blog" was once known as a "weblog", and that what we term a "BlogPosting" is now often colloquially referred to as a "blog".',
			rangeIncludes: ['BlogPosting'],
		},
		{
			id: 'schema:issn',
			name: 'issn',
			label: 'issn',
			comment:
				'The International Standard Serial Number (ISSN) that identifies this serial publication. You can repeat this property to identify different formats of, or the linking ISSN (ISSN-L) for, this serial publication.',
			rangeIncludes: ['Text'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgBlog;
export const Blog = schemaOrgBlog;

export default schemaOrgBlog;
