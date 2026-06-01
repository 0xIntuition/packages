import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgBoatTerminal = {
	id: 'schema:BoatTerminal',
	name: 'BoatTerminal',
	label: 'BoatTerminal',
	comment: 'A terminal for boats, ships, and other water vessels.',
	subClassOf: ['CivicStructure', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgBoatTerminal;
export const BoatTerminal = schemaOrgBoatTerminal;

export default schemaOrgBoatTerminal;
