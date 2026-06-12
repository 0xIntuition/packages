import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMedicalSignOrSymptom = {
	id: 'schema:MedicalSignOrSymptom',
	name: 'MedicalSignOrSymptom',
	label: 'MedicalSignOrSymptom',
	comment:
		'Any feature associated or not with a medical condition. In medicine a symptom is generally subjective while a sign is objective.',
	subClassOf: ['MedicalCondition', 'MedicalEntity', 'Thing'],
	properties: [
		{
			id: 'schema:possibleTreatment',
			name: 'possibleTreatment',
			label: 'possibleTreatment',
			comment: 'A possible treatment to address this condition, sign or symptom.',
			rangeIncludes: ['Drug', 'DrugClass', 'LifestyleModification', 'MedicalTherapy'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgMedicalSignOrSymptom;
export const MedicalSignOrSymptom = schemaOrgMedicalSignOrSymptom;

export default schemaOrgMedicalSignOrSymptom;
