import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMedicalCode = {
	id: 'schema:MedicalCode',
	name: 'MedicalCode',
	label: 'MedicalCode',
	comment: 'A code for a medical entity.',
	subClassOf: [
		'CategoryCode',
		'MedicalIntangible',
		'DefinedTerm',
		'MedicalEntity',
		'Intangible',
		'Thing',
	],
	properties: [
		{
			id: 'schema:codeValue',
			name: 'codeValue',
			label: 'codeValue',
			comment: 'A short textual code that uniquely identifies the value.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:codingSystem',
			name: 'codingSystem',
			label: 'codingSystem',
			comment: "The coding system, e.g. 'ICD-10'.",
			rangeIncludes: ['Text'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgMedicalCode;
export const MedicalCode = schemaOrgMedicalCode;

export default schemaOrgMedicalCode;
