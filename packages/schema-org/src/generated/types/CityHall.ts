import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgCityHall = {
	id: 'schema:CityHall',
	name: 'CityHall',
	label: 'CityHall',
	comment: 'A city hall.',
	subClassOf: ['GovernmentBuilding', 'CivicStructure', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgCityHall;
export const CityHall = schemaOrgCityHall;

export default schemaOrgCityHall;
