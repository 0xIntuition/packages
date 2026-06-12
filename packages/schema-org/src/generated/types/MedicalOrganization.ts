import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMedicalOrganization = {
	id: 'schema:MedicalOrganization',
	name: 'MedicalOrganization',
	label: 'MedicalOrganization',
	comment: 'A medical organization (physical or not), such as hospital, institution or clinic.',
	subClassOf: ['Organization', 'Thing'],
	properties: [
		{
			id: 'schema:healthPlanNetworkId',
			name: 'healthPlanNetworkId',
			label: 'healthPlanNetworkId',
			comment:
				'Name or unique ID of network. (Networks are often reused across different insurance plans.)',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:isAcceptingNewPatients',
			name: 'isAcceptingNewPatients',
			label: 'isAcceptingNewPatients',
			comment: 'Whether the provider is accepting new patients.',
			rangeIncludes: ['Boolean'],
		},
		{
			id: 'schema:medicalSpecialty',
			name: 'medicalSpecialty',
			label: 'medicalSpecialty',
			comment: 'A medical specialty of the provider.',
			rangeIncludes: ['MedicalSpecialty'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgMedicalOrganization;
export const MedicalOrganization = schemaOrgMedicalOrganization;

export default schemaOrgMedicalOrganization;
