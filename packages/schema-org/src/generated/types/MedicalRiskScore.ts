import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMedicalRiskScore = {
	id: 'schema:MedicalRiskScore',
	name: 'MedicalRiskScore',
	label: 'MedicalRiskScore',
	comment:
		'A simple system that adds up the number of risk factors to yield a score that is associated with prognosis, e.g. CHAD score, TIMI risk score.',
	subClassOf: ['MedicalRiskEstimator', 'MedicalEntity', 'Thing'],
	properties: [
		{
			id: 'schema:algorithm',
			name: 'algorithm',
			label: 'algorithm',
			comment: 'The algorithm or rules to follow to compute the score.',
			rangeIncludes: ['Text'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgMedicalRiskScore;
export const MedicalRiskScore = schemaOrgMedicalRiskScore;

export default schemaOrgMedicalRiskScore;
