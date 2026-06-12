import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMedicalScholarlyArticle = {
	id: 'schema:MedicalScholarlyArticle',
	name: 'MedicalScholarlyArticle',
	label: 'MedicalScholarlyArticle',
	comment: 'A scholarly article in the medical domain.',
	subClassOf: ['ScholarlyArticle', 'Article', 'CreativeWork', 'Thing'],
	properties: [
		{
			id: 'schema:publicationType',
			name: 'publicationType',
			label: 'publicationType',
			comment:
				'The type of the medical article, taken from the US NLM MeSH publication type catalog. See also [MeSH documentation](http://www.nlm.nih.gov/mesh/pubtypes.html).',
			rangeIncludes: ['Text'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgMedicalScholarlyArticle;
export const MedicalScholarlyArticle = schemaOrgMedicalScholarlyArticle;

export default schemaOrgMedicalScholarlyArticle;
