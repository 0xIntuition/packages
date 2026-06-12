import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMedicalTest = {
	id: 'schema:MedicalTest',
	name: 'MedicalTest',
	label: 'MedicalTest',
	comment: 'Any medical test, typically performed for diagnostic purposes.',
	subClassOf: ['MedicalEntity', 'Thing'],
	properties: [
		{
			id: 'schema:affectedBy',
			name: 'affectedBy',
			label: 'affectedBy',
			comment: "Drugs that affect the test's results.",
			rangeIncludes: ['Drug'],
		},
		{
			id: 'schema:normalRange',
			name: 'normalRange',
			label: 'normalRange',
			comment: 'Range of acceptable values for a typical patient, when applicable.',
			rangeIncludes: ['MedicalEnumeration', 'Text'],
		},
		{
			id: 'schema:signDetected',
			name: 'signDetected',
			label: 'signDetected',
			comment: 'A sign detected by the test.',
			rangeIncludes: ['MedicalSign'],
		},
		{
			id: 'schema:usedToDiagnose',
			name: 'usedToDiagnose',
			label: 'usedToDiagnose',
			comment: 'A condition the test is used to diagnose.',
			rangeIncludes: ['MedicalCondition'],
		},
		{
			id: 'schema:usesDevice',
			name: 'usesDevice',
			label: 'usesDevice',
			comment: 'Device used to perform the test.',
			rangeIncludes: ['MedicalDevice'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgMedicalTest;
export const MedicalTest = schemaOrgMedicalTest;

export default schemaOrgMedicalTest;
