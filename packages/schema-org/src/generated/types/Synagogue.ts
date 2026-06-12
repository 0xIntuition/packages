import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgSynagogue = {
	id: 'schema:Synagogue',
	name: 'Synagogue',
	label: 'Synagogue',
	comment: 'A synagogue.',
	subClassOf: ['PlaceOfWorship', 'CivicStructure', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgSynagogue;
export const Synagogue = schemaOrgSynagogue;

export default schemaOrgSynagogue;
