import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgAirline = {
	id: 'schema:Airline',
	name: 'Airline',
	label: 'Airline',
	comment: 'An organization that provides flights for passengers.',
	subClassOf: ['Organization', 'Thing'],
	properties: [
		{
			id: 'schema:boardingPolicy',
			name: 'boardingPolicy',
			label: 'boardingPolicy',
			comment: 'The type of boarding policy used by the airline (e.g. zone-based or group-based).',
			rangeIncludes: ['BoardingPolicyType'],
		},
		{
			id: 'schema:iataCode',
			name: 'iataCode',
			label: 'iataCode',
			comment: 'IATA identifier for an airline or airport.',
			rangeIncludes: ['Text'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgAirline;
export const Airline = schemaOrgAirline;

export default schemaOrgAirline;
