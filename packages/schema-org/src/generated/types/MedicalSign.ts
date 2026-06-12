import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMedicalSign = {
	id: 'schema:MedicalSign',
	name: 'MedicalSign',
	label: 'MedicalSign',
	comment:
		"Any physical manifestation of a person's medical condition discoverable by objective diagnostic tests or physical examination.",
	subClassOf: ['MedicalSignOrSymptom', 'MedicalCondition', 'MedicalEntity', 'Thing'],
	properties: [
		{
			id: 'schema:identifyingExam',
			name: 'identifyingExam',
			label: 'identifyingExam',
			comment: 'A physical examination that can identify this sign.',
			rangeIncludes: ['PhysicalExam'],
		},
		{
			id: 'schema:identifyingTest',
			name: 'identifyingTest',
			label: 'identifyingTest',
			comment: 'A diagnostic test that can identify this sign.',
			rangeIncludes: ['MedicalTest'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgMedicalSign;
export const MedicalSign = schemaOrgMedicalSign;

export default schemaOrgMedicalSign;
