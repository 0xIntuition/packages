import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgBodyOfWater = {
	id: 'schema:BodyOfWater',
	name: 'BodyOfWater',
	label: 'BodyOfWater',
	comment: 'A body of water, such as a sea, ocean, or lake.',
	subClassOf: ['Landform', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgBodyOfWater;
export const BodyOfWater = schemaOrgBodyOfWater;

export default schemaOrgBodyOfWater;
