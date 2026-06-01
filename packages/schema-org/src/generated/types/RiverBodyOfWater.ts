import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgRiverBodyOfWater = {
	id: 'schema:RiverBodyOfWater',
	name: 'RiverBodyOfWater',
	label: 'RiverBodyOfWater',
	comment: 'A river (for example, the broad majestic Shannon).',
	subClassOf: ['BodyOfWater', 'Landform', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgRiverBodyOfWater;
export const RiverBodyOfWater = schemaOrgRiverBodyOfWater;

export default schemaOrgRiverBodyOfWater;
