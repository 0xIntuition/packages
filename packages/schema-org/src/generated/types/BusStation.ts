import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgBusStation = {
	id: 'schema:BusStation',
	name: 'BusStation',
	label: 'BusStation',
	comment: 'A bus station.',
	subClassOf: ['CivicStructure', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgBusStation;
export const BusStation = schemaOrgBusStation;

export default schemaOrgBusStation;
