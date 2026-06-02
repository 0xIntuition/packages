import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgPatient = {
	id: 'schema:Patient',
	name: 'Patient',
	label: 'Patient',
	comment: 'A patient is any person recipient of health care services.',
	subClassOf: ['MedicalAudience', 'Person', 'Audience', 'PeopleAudience', 'Thing', 'Intangible'],
	properties: [
		{
			id: 'schema:diagnosis',
			name: 'diagnosis',
			label: 'diagnosis',
			comment:
				'One or more alternative conditions considered in the differential diagnosis process as output of a diagnosis process.',
			rangeIncludes: ['MedicalCondition'],
		},
		{
			id: 'schema:drug',
			name: 'drug',
			label: 'drug',
			comment: 'Specifying a drug or medicine used in a medication procedure.',
			rangeIncludes: ['Drug'],
		},
		{
			id: 'schema:healthCondition',
			name: 'healthCondition',
			label: 'healthCondition',
			comment:
				'Specifying the health condition(s) of a patient, medical study, or other target audience.',
			rangeIncludes: ['MedicalCondition'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgPatient;
export const Patient = schemaOrgPatient;

export default schemaOrgPatient;
