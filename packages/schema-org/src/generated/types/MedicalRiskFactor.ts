import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMedicalRiskFactor = {
	id: 'schema:MedicalRiskFactor',
	name: 'MedicalRiskFactor',
	label: 'MedicalRiskFactor',
	comment:
		"A risk factor is anything that increases a person's likelihood of developing or contracting a disease, medical condition, or complication.",
	subClassOf: ['MedicalEntity', 'Thing'],
	properties: [
		{
			id: 'schema:increasesRiskOf',
			name: 'increasesRiskOf',
			label: 'increasesRiskOf',
			comment: 'The condition, complication, etc. influenced by this factor.',
			rangeIncludes: ['MedicalEntity'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgMedicalRiskFactor;
export const MedicalRiskFactor = schemaOrgMedicalRiskFactor;

export default schemaOrgMedicalRiskFactor;
