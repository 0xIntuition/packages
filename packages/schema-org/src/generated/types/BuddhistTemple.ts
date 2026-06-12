import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgBuddhistTemple = {
	id: 'schema:BuddhistTemple',
	name: 'BuddhistTemple',
	label: 'BuddhistTemple',
	comment: 'A Buddhist temple.',
	subClassOf: ['PlaceOfWorship', 'CivicStructure', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgBuddhistTemple;
export const BuddhistTemple = schemaOrgBuddhistTemple;

export default schemaOrgBuddhistTemple;
