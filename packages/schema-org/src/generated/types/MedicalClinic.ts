import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMedicalClinic = {
	id: 'schema:MedicalClinic',
	name: 'MedicalClinic',
	label: 'MedicalClinic',
	comment:
		'A facility, often associated with a hospital or medical school, that is devoted to the specific diagnosis and/or healthcare. Previously limited to outpatients but with evolution it may be open to inpatients as well.',
	subClassOf: [
		'MedicalBusiness',
		'MedicalOrganization',
		'LocalBusiness',
		'Organization',
		'Place',
		'Thing',
	],
	properties: [
		{
			id: 'schema:availableService',
			name: 'availableService',
			label: 'availableService',
			comment: 'A medical service available from this provider.',
			rangeIncludes: ['MedicalProcedure', 'MedicalTest', 'MedicalTherapy'],
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

export const spec = schemaOrgMedicalClinic;
export const MedicalClinic = schemaOrgMedicalClinic;

export default schemaOrgMedicalClinic;
