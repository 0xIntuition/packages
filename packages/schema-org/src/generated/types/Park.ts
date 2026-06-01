import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgPark = {
	id: 'schema:Park',
	name: 'Park',
	label: 'Park',
	comment: 'A park.',
	subClassOf: ['CivicStructure', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgPark;
export const Park = schemaOrgPark;

export default schemaOrgPark;
