import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgAskPublicNewsArticle = {
	id: 'schema:AskPublicNewsArticle',
	name: 'AskPublicNewsArticle',
	label: 'AskPublicNewsArticle',
	comment:
		'A [[NewsArticle]] expressing an open call by a [[NewsMediaOrganization]] asking the public for input, insights, clarifications, anecdotes, documentation, etc., on an issue, for reporting purposes.',
	subClassOf: ['NewsArticle', 'Article', 'CreativeWork', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgAskPublicNewsArticle;
export const AskPublicNewsArticle = schemaOrgAskPublicNewsArticle;

export default schemaOrgAskPublicNewsArticle;
