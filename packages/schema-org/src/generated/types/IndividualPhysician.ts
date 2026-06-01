import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgIndividualPhysician = {
	id: 'schema:IndividualPhysician',
	name: 'IndividualPhysician',
	label: 'IndividualPhysician',
	comment:
		'An individual medical practitioner. For their official address use [[address]], for affiliations to hospitals use [[hospitalAffiliation]]. \nThe [[practicesAt]] property can be used to indicate [[MedicalOrganization]] hospitals, clinics, pharmacies etc. where this physician practices.',
	subClassOf: [
		'Physician',
		'MedicalBusiness',
		'LocalBusiness',
		'Organization',
		'Thing',
		'Place',
		'MedicalOrganization',
	],
	properties: [
		{
			id: 'schema:practicesAt',
			name: 'practicesAt',
			label: 'practicesAt',
			comment: 'A [[MedicalOrganization]] where the [[IndividualPhysician]] practices.',
			rangeIncludes: ['MedicalOrganization'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgIndividualPhysician;
export const IndividualPhysician = schemaOrgIndividualPhysician;

export default schemaOrgIndividualPhysician;
