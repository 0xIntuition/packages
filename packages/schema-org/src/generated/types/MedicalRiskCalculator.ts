import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMedicalRiskCalculator = {
	id: 'schema:MedicalRiskCalculator',
	name: 'MedicalRiskCalculator',
	label: 'MedicalRiskCalculator',
	comment:
		'A complex mathematical calculation requiring an online calculator, used to assess prognosis. Note: use the url property of Thing to record any URLs for online calculators.',
	subClassOf: ['MedicalRiskEstimator', 'MedicalEntity', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgMedicalRiskCalculator;
export const MedicalRiskCalculator = schemaOrgMedicalRiskCalculator;

export default schemaOrgMedicalRiskCalculator;
