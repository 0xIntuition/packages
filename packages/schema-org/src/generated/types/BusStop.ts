import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgBusStop = {
	id: 'schema:BusStop',
	name: 'BusStop',
	label: 'BusStop',
	comment: 'A bus stop.',
	subClassOf: ['CivicStructure', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgBusStop;
export const BusStop = schemaOrgBusStop;

export default schemaOrgBusStop;
