import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgLakeBodyOfWater = {
	id: 'schema:LakeBodyOfWater',
	name: 'LakeBodyOfWater',
	label: 'LakeBodyOfWater',
	comment: 'A lake (for example, Lake Pontrachain).',
	subClassOf: ['BodyOfWater', 'Landform', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgLakeBodyOfWater;
export const LakeBodyOfWater = schemaOrgLakeBodyOfWater;

export default schemaOrgLakeBodyOfWater;
