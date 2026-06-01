import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgOpinionNewsArticle = {
	id: 'schema:OpinionNewsArticle',
	name: 'OpinionNewsArticle',
	label: 'OpinionNewsArticle',
	comment:
		'An [[OpinionNewsArticle]] is a [[NewsArticle]] that primarily expresses opinions rather than journalistic reporting of news and events. For example, a [[NewsArticle]] consisting of a column or [[Blog]]/[[BlogPosting]] entry in the Opinions section of a news publication. ',
	subClassOf: ['NewsArticle', 'Article', 'CreativeWork', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgOpinionNewsArticle;
export const OpinionNewsArticle = schemaOrgOpinionNewsArticle;

export default schemaOrgOpinionNewsArticle;
