import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgHospital = {
	id: 'schema:Hospital',
	name: 'Hospital',
	label: 'Hospital',
	comment: 'A hospital.',
	subClassOf: [
		'CivicStructure',
		'Place',
		'Thing',
		'EmergencyService',
		'LocalBusiness',
		'Organization',
		'MedicalOrganization',
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
			id: 'schema:healthcareReportingData',
			name: 'healthcareReportingData',
			label: 'healthcareReportingData',
			comment:
				'Indicates data describing a hospital, e.g. a CDC [[CDCPMDRecord]] or as some kind of [[Dataset]].',
			rangeIncludes: ['CDCPMDRecord', 'Dataset'],
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

export const spec = schemaOrgHospital;
export const Hospital = schemaOrgHospital;

export default schemaOrgHospital;
