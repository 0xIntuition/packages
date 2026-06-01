import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgPharmacy = {
	id: 'schema:Pharmacy',
	name: 'Pharmacy',
	label: 'Pharmacy',
	comment: 'A pharmacy or drugstore.',
	subClassOf: [
		'MedicalBusiness',
		'LocalBusiness',
		'Organization',
		'Thing',
		'Place',
		'MedicalOrganization',
	],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgPharmacy;
export const Pharmacy = schemaOrgPharmacy;

export default schemaOrgPharmacy;
