import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgPlayground = {
	id: 'schema:Playground',
	name: 'Playground',
	label: 'Playground',
	comment: 'A playground.',
	subClassOf: ['CivicStructure', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgPlayground;
export const Playground = schemaOrgPlayground;

export default schemaOrgPlayground;
