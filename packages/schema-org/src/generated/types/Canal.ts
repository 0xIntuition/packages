import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgCanal = {
	id: 'schema:Canal',
	name: 'Canal',
	label: 'Canal',
	comment: 'A canal, like the Panama Canal.',
	subClassOf: ['BodyOfWater', 'Landform', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgCanal;
export const Canal = schemaOrgCanal;

export default schemaOrgCanal;
