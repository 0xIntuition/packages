import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgZoo = {
	id: 'schema:Zoo',
	name: 'Zoo',
	label: 'Zoo',
	comment: 'A zoo.',
	subClassOf: ['CivicStructure', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgZoo;
export const Zoo = schemaOrgZoo;

export default schemaOrgZoo;
