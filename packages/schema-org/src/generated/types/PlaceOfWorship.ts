import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgPlaceOfWorship = {
	id: 'schema:PlaceOfWorship',
	name: 'PlaceOfWorship',
	label: 'PlaceOfWorship',
	comment: 'Place of worship, such as a church, synagogue, or mosque.',
	subClassOf: ['CivicStructure', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgPlaceOfWorship;
export const PlaceOfWorship = schemaOrgPlaceOfWorship;

export default schemaOrgPlaceOfWorship;
