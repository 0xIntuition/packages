import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgFlight = {
	id: 'schema:Flight',
	name: 'Flight',
	label: 'Flight',
	comment: 'An airline flight.',
	subClassOf: ['Trip', 'Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:aircraft',
			name: 'aircraft',
			label: 'aircraft',
			comment: 'The kind of aircraft (e.g., "Boeing 747").',
			rangeIncludes: ['Text', 'Vehicle'],
		},
		{
			id: 'schema:arrivalAirport',
			name: 'arrivalAirport',
			label: 'arrivalAirport',
			comment: 'The airport where the flight terminates.',
			rangeIncludes: ['Airport'],
		},
		{
			id: 'schema:arrivalGate',
			name: 'arrivalGate',
			label: 'arrivalGate',
			comment: "Identifier of the flight's arrival gate.",
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:arrivalTerminal',
			name: 'arrivalTerminal',
			label: 'arrivalTerminal',
			comment: "Identifier of the flight's arrival terminal.",
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:boardingPolicy',
			name: 'boardingPolicy',
			label: 'boardingPolicy',
			comment: 'The type of boarding policy used by the airline (e.g. zone-based or group-based).',
			rangeIncludes: ['BoardingPolicyType'],
		},
		{
			id: 'schema:carrier',
			name: 'carrier',
			label: 'carrier',
			comment:
				"'carrier' is an out-dated term indicating the 'provider' for parcel delivery and flights.",
			rangeIncludes: ['Organization'],
		},
		{
			id: 'schema:departureAirport',
			name: 'departureAirport',
			label: 'departureAirport',
			comment: 'The airport where the flight originates.',
			rangeIncludes: ['Airport'],
		},
		{
			id: 'schema:departureGate',
			name: 'departureGate',
			label: 'departureGate',
			comment: "Identifier of the flight's departure gate.",
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:departureTerminal',
			name: 'departureTerminal',
			label: 'departureTerminal',
			comment: "Identifier of the flight's departure terminal.",
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:estimatedFlightDuration',
			name: 'estimatedFlightDuration',
			label: 'estimatedFlightDuration',
			comment: 'The estimated time the flight will take.',
			rangeIncludes: ['Duration', 'Text'],
		},
		{
			id: 'schema:flightDistance',
			name: 'flightDistance',
			label: 'flightDistance',
			comment: 'The distance of the flight.',
			rangeIncludes: ['Distance', 'Text'],
		},
		{
			id: 'schema:flightNumber',
			name: 'flightNumber',
			label: 'flightNumber',
			comment:
				"The unique identifier for a flight including the airline IATA code. For example, if describing United flight 110, where the IATA code for United is 'UA', the flightNumber is 'UA110'.",
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:mealService',
			name: 'mealService',
			label: 'mealService',
			comment: 'Description of the meals that will be provided or available for purchase.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:seller',
			name: 'seller',
			label: 'seller',
			comment:
				'An entity which offers (sells / leases / lends / loans) the services / goods.  A seller may also be a provider.',
			rangeIncludes: ['Organization', 'Person'],
		},
		{
			id: 'schema:webCheckinTime',
			name: 'webCheckinTime',
			label: 'webCheckinTime',
			comment: 'The time when a passenger can check into the flight online.',
			rangeIncludes: ['DateTime'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgFlight;
export const Flight = schemaOrgFlight;

export default schemaOrgFlight;
