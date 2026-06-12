import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgBridge = {
	id: 'schema:Bridge',
	name: 'Bridge',
	label: 'Bridge',
	comment: 'A bridge.',
	subClassOf: ['CivicStructure', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgBridge;
export const Bridge = schemaOrgBridge;

export default schemaOrgBridge;
