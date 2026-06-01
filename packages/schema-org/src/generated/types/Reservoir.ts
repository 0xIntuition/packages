import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgReservoir = {
	id: 'schema:Reservoir',
	name: 'Reservoir',
	label: 'Reservoir',
	comment:
		'A reservoir of water, typically an artificially created lake, like the Lake Kariba reservoir.',
	subClassOf: ['BodyOfWater', 'Landform', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgReservoir;
export const Reservoir = schemaOrgReservoir;

export default schemaOrgReservoir;
