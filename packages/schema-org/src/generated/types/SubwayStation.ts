import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgSubwayStation = {
	id: 'schema:SubwayStation',
	name: 'SubwayStation',
	label: 'SubwayStation',
	comment: 'A subway station.',
	subClassOf: ['CivicStructure', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgSubwayStation;
export const SubwayStation = schemaOrgSubwayStation;

export default schemaOrgSubwayStation;
