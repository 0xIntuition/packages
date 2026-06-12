import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgAnalysisNewsArticle = {
	id: 'schema:AnalysisNewsArticle',
	name: 'AnalysisNewsArticle',
	label: 'AnalysisNewsArticle',
	comment:
		'An AnalysisNewsArticle is a [[NewsArticle]] that, while based on factual reporting, incorporates the expertise of the author/producer, offering interpretations and conclusions.',
	subClassOf: ['NewsArticle', 'Article', 'CreativeWork', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgAnalysisNewsArticle;
export const AnalysisNewsArticle = schemaOrgAnalysisNewsArticle;

export default schemaOrgAnalysisNewsArticle;
