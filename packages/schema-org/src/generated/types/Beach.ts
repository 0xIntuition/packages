import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgBeach = {
	id: 'schema:Beach',
	name: 'Beach',
	label: 'Beach',
	comment: 'Beach.',
	subClassOf: ['CivicStructure', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgBeach;
export const Beach = schemaOrgBeach;

export default schemaOrgBeach;
