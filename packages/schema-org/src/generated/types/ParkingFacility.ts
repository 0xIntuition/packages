import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgParkingFacility = {
	id: 'schema:ParkingFacility',
	name: 'ParkingFacility',
	label: 'ParkingFacility',
	comment: 'A parking lot or other parking facility.',
	subClassOf: ['CivicStructure', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgParkingFacility;
export const ParkingFacility = schemaOrgParkingFacility;

export default schemaOrgParkingFacility;
