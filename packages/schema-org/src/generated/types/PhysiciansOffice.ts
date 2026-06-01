import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgPhysiciansOffice = {
	id: 'schema:PhysiciansOffice',
	name: 'PhysiciansOffice',
	label: 'PhysiciansOffice',
	comment: "A doctor's office or clinic.",
	subClassOf: [
		'Physician',
		'MedicalBusiness',
		'LocalBusiness',
		'Organization',
		'Thing',
		'Place',
		'MedicalOrganization',
	],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgPhysiciansOffice;
export const PhysiciansOffice = schemaOrgPhysiciansOffice;

export default schemaOrgPhysiciansOffice;
