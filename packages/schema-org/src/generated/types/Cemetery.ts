import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgCemetery = {
	id: 'schema:Cemetery',
	name: 'Cemetery',
	label: 'Cemetery',
	comment: 'A graveyard.',
	subClassOf: ['CivicStructure', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgCemetery;
export const Cemetery = schemaOrgCemetery;

export default schemaOrgCemetery;
