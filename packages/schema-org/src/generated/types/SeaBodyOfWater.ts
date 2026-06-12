import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgSeaBodyOfWater = {
	id: 'schema:SeaBodyOfWater',
	name: 'SeaBodyOfWater',
	label: 'SeaBodyOfWater',
	comment: 'A sea (for example, the Caspian sea).',
	subClassOf: ['BodyOfWater', 'Landform', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgSeaBodyOfWater;
export const SeaBodyOfWater = schemaOrgSeaBodyOfWater;

export default schemaOrgSeaBodyOfWater;
