import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgThesis = {
	id: 'schema:Thesis',
	name: 'Thesis',
	label: 'Thesis',
	comment:
		'A thesis or dissertation document submitted in support of candidature for an academic degree or professional qualification.',
	subClassOf: ['CreativeWork', 'Thing'],
	properties: [
		{
			id: 'schema:inSupportOf',
			name: 'inSupportOf',
			label: 'inSupportOf',
			comment: 'Qualification, candidature, degree, application that Thesis supports.',
			rangeIncludes: ['Text'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgThesis;
export const Thesis = schemaOrgThesis;

export default schemaOrgThesis;
