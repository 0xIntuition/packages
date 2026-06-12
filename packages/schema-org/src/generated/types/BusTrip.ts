import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgBusTrip = {
	id: 'schema:BusTrip',
	name: 'BusTrip',
	label: 'BusTrip',
	comment: 'A trip on a commercial bus line.',
	subClassOf: ['Trip', 'Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:arrivalBusStop',
			name: 'arrivalBusStop',
			label: 'arrivalBusStop',
			comment: 'The stop or station from which the bus arrives.',
			rangeIncludes: ['BusStation', 'BusStop'],
		},
		{
			id: 'schema:busName',
			name: 'busName',
			label: 'busName',
			comment: 'The name of the bus (e.g. Bolt Express).',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:busNumber',
			name: 'busNumber',
			label: 'busNumber',
			comment: 'The unique identifier for the bus.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:departureBusStop',
			name: 'departureBusStop',
			label: 'departureBusStop',
			comment: 'The stop or station from which the bus departs.',
			rangeIncludes: ['BusStation', 'BusStop'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgBusTrip;
export const BusTrip = schemaOrgBusTrip;

export default schemaOrgBusTrip;
