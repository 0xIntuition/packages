import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgDrugLegalStatus = {
	id: 'schema:DrugLegalStatus',
	name: 'DrugLegalStatus',
	label: 'DrugLegalStatus',
	comment: 'The legal availability status of a medical drug.',
	subClassOf: ['MedicalIntangible', 'MedicalEntity', 'Thing'],
	properties: [
		{
			id: 'schema:applicableLocation',
			name: 'applicableLocation',
			label: 'applicableLocation',
			comment: 'The location in which the status applies.',
			rangeIncludes: ['AdministrativeArea'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgDrugLegalStatus;
export const DrugLegalStatus = schemaOrgDrugLegalStatus;

export default schemaOrgDrugLegalStatus;
