import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgOceanBodyOfWater = {
	id: 'schema:OceanBodyOfWater',
	name: 'OceanBodyOfWater',
	label: 'OceanBodyOfWater',
	comment: 'An ocean (for example, the Pacific).',
	subClassOf: ['BodyOfWater', 'Landform', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgOceanBodyOfWater;
export const OceanBodyOfWater = schemaOrgOceanBodyOfWater;

export default schemaOrgOceanBodyOfWater;
