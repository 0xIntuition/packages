import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgWaterfall = {
	id: 'schema:Waterfall',
	name: 'Waterfall',
	label: 'Waterfall',
	comment: 'A waterfall, like Niagara.',
	subClassOf: ['BodyOfWater', 'Landform', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgWaterfall;
export const Waterfall = schemaOrgWaterfall;

export default schemaOrgWaterfall;
