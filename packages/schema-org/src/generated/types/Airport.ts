import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgAirport = {
	id: 'schema:Airport',
	name: 'Airport',
	label: 'Airport',
	comment: 'An airport.',
	subClassOf: ['CivicStructure', 'Place', 'Thing'],
	properties: [
		{
			id: 'schema:iataCode',
			name: 'iataCode',
			label: 'iataCode',
			comment: 'IATA identifier for an airline or airport.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:icaoCode',
			name: 'icaoCode',
			label: 'icaoCode',
			comment: 'ICAO identifier for an airport.',
			rangeIncludes: ['Text'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgAirport;
export const Airport = schemaOrgAirport;

export default schemaOrgAirport;
