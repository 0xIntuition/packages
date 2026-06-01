import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgDentist = {
	id: 'schema:Dentist',
	name: 'Dentist',
	label: 'Dentist',
	comment: 'A dentist.',
	subClassOf: [
		'LocalBusiness',
		'Organization',
		'Thing',
		'Place',
		'MedicalBusiness',
		'MedicalOrganization',
	],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgDentist;
export const Dentist = schemaOrgDentist;

export default schemaOrgDentist;
