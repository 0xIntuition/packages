import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMuseum = {
	id: 'schema:Museum',
	name: 'Museum',
	label: 'Museum',
	comment: 'A museum.',
	subClassOf: ['CivicStructure', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgMuseum;
export const Museum = schemaOrgMuseum;

export default schemaOrgMuseum;
