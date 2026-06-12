import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgHinduTemple = {
	id: 'schema:HinduTemple',
	name: 'HinduTemple',
	label: 'HinduTemple',
	comment: 'A Hindu temple.',
	subClassOf: ['PlaceOfWorship', 'CivicStructure', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgHinduTemple;
export const HinduTemple = schemaOrgHinduTemple;

export default schemaOrgHinduTemple;
