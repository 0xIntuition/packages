import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgCity = {
	id: 'schema:City',
	name: 'City',
	label: 'City',
	comment: 'A city or town.',
	subClassOf: ['AdministrativeArea', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgCity;
export const City = schemaOrgCity;

export default schemaOrgCity;
