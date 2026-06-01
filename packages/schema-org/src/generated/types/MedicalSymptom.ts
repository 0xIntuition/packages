import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMedicalSymptom = {
	id: 'schema:MedicalSymptom',
	name: 'MedicalSymptom',
	label: 'MedicalSymptom',
	comment:
		'Any complaint sensed and expressed by the patient (therefore defined as subjective)  like stomachache, lower-back pain, or fatigue.',
	subClassOf: ['MedicalSignOrSymptom', 'MedicalCondition', 'MedicalEntity', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgMedicalSymptom;
export const MedicalSymptom = schemaOrgMedicalSymptom;

export default schemaOrgMedicalSymptom;
