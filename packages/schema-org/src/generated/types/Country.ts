import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgCountry = {
	id: 'schema:Country',
	name: 'Country',
	label: 'Country',
	comment: 'A country.',
	subClassOf: ['AdministrativeArea', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgCountry;
export const Country = schemaOrgCountry;

export default schemaOrgCountry;
