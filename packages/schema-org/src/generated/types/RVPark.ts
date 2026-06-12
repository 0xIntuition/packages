import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgRVPark = {
	id: 'schema:RVPark',
	name: 'RVPark',
	label: 'RVPark',
	comment:
		'A place offering space for "Recreational Vehicles", Caravans, mobile homes and the like.',
	subClassOf: ['CivicStructure', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgRVPark;
export const RVPark = schemaOrgRVPark;

export default schemaOrgRVPark;
