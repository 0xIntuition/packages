import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMedicalRiskEstimator = {
	id: 'schema:MedicalRiskEstimator',
	name: 'MedicalRiskEstimator',
	label: 'MedicalRiskEstimator',
	comment:
		'Any rule set or interactive tool for estimating the risk of developing a complication or condition.',
	subClassOf: ['MedicalEntity', 'Thing'],
	properties: [
		{
			id: 'schema:estimatesRiskOf',
			name: 'estimatesRiskOf',
			label: 'estimatesRiskOf',
			comment: 'The condition, complication, or symptom whose risk is being estimated.',
			rangeIncludes: ['MedicalEntity'],
		},
		{
			id: 'schema:includedRiskFactor',
			name: 'includedRiskFactor',
			label: 'includedRiskFactor',
			comment:
				'A modifiable or non-modifiable risk factor included in the calculation, e.g. age, coexisting condition.',
			rangeIncludes: ['MedicalRiskFactor'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgMedicalRiskEstimator;
export const MedicalRiskEstimator = schemaOrgMedicalRiskEstimator;

export default schemaOrgMedicalRiskEstimator;
