import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgPharmacy = {
	id: 'schema:Pharmacy',
	name: 'Pharmacy',
	label: 'Pharmacy',
	comment: 'A pharmacy or drugstore.',
	subClassOf: [
		'MedicalBusiness',
		'MedicalOrganization',
		'LocalBusiness',
		'Organization',
		'Place',
		'Thing',
	],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgPharmacy;
export const Pharmacy = schemaOrgPharmacy;

export default schemaOrgPharmacy;
