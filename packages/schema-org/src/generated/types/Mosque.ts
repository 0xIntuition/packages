import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMosque = {
	id: 'schema:Mosque',
	name: 'Mosque',
	label: 'Mosque',
	comment: 'A mosque.',
	subClassOf: ['PlaceOfWorship', 'CivicStructure', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgMosque;
export const Mosque = schemaOrgMosque;

export default schemaOrgMosque;
