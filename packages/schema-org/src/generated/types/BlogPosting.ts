import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgBlogPosting = {
	id: 'schema:BlogPosting',
	name: 'BlogPosting',
	label: 'BlogPosting',
	comment: 'A blog post.',
	subClassOf: ['SocialMediaPosting', 'Article', 'CreativeWork', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgBlogPosting;
export const BlogPosting = schemaOrgBlogPosting;

export default schemaOrgBlogPosting;
