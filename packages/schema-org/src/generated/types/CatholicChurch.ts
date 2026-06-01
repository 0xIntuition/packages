import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgCatholicChurch = {
	id: 'schema:CatholicChurch',
	name: 'CatholicChurch',
	label: 'CatholicChurch',
	comment: 'A Catholic church.',
	subClassOf: ['Church', 'PlaceOfWorship', 'CivicStructure', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgCatholicChurch;
export const CatholicChurch = schemaOrgCatholicChurch;

export default schemaOrgCatholicChurch;
