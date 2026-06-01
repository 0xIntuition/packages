import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgPond = {
	id: 'schema:Pond',
	name: 'Pond',
	label: 'Pond',
	comment: 'A pond.',
	subClassOf: ['BodyOfWater', 'Landform', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgPond;
export const Pond = schemaOrgPond;

export default schemaOrgPond;
