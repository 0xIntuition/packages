import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgOptician = {
	id: 'schema:Optician',
	name: 'Optician',
	label: 'Optician',
	comment: 'A store that sells reading glasses and similar devices for improving vision.',
	subClassOf: ['MedicalBusiness', 'LocalBusiness', 'Organization', 'Thing', 'Place'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgOptician;
export const Optician = schemaOrgOptician;

export default schemaOrgOptician;
