import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgChurch = {
	id: 'schema:Church',
	name: 'Church',
	label: 'Church',
	comment: 'A church.',
	subClassOf: ['PlaceOfWorship', 'CivicStructure', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgChurch;
export const Church = schemaOrgChurch;

export default schemaOrgChurch;
