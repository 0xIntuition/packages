import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgVitalSign = {
	id: 'schema:VitalSign',
	name: 'VitalSign',
	label: 'VitalSign',
	comment:
		'Vital signs are measures of various physiological functions in order to assess the most basic body functions.',
	subClassOf: ['MedicalSign', 'MedicalSignOrSymptom', 'MedicalCondition', 'MedicalEntity', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgVitalSign;
export const VitalSign = schemaOrgVitalSign;

export default schemaOrgVitalSign;
