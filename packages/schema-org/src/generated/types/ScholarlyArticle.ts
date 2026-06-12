import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgScholarlyArticle = {
	id: 'schema:ScholarlyArticle',
	name: 'ScholarlyArticle',
	label: 'ScholarlyArticle',
	comment: 'A scholarly article.',
	subClassOf: ['Article', 'CreativeWork', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgScholarlyArticle;
export const ScholarlyArticle = schemaOrgScholarlyArticle;

export default schemaOrgScholarlyArticle;
