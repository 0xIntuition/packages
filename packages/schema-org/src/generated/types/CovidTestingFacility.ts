import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgCovidTestingFacility = {
	id: 'schema:CovidTestingFacility',
	name: 'CovidTestingFacility',
	label: 'CovidTestingFacility',
	comment:
		'A CovidTestingFacility is a [[MedicalClinic]] where testing for the COVID-19 Coronavirus\n      disease is available. If the facility is being made available from an established [[Pharmacy]], [[Hotel]], or other\n      non-medical organization, multiple types can be listed. This makes it easier to re-use existing schema.org information\n      about that place, e.g. contact info, address, opening hours. Note that in an emergency, such information may not always be reliable.\n      ',
	subClassOf: [
		'MedicalClinic',
		'MedicalBusiness',
		'MedicalOrganization',
		'LocalBusiness',
		'Organization',
		'Place',
		'Thing',
	],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgCovidTestingFacility;
export const CovidTestingFacility = schemaOrgCovidTestingFacility;

export default schemaOrgCovidTestingFacility;
