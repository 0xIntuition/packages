import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgCrematorium = {
	id: 'schema:Crematorium',
	name: 'Crematorium',
	label: 'Crematorium',
	comment: 'A crematorium.',
	subClassOf: ['CivicStructure', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgCrematorium;
export const Crematorium = schemaOrgCrematorium;

export default schemaOrgCrematorium;
