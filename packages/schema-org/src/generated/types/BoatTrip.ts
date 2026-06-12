import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgBoatTrip = {
	id: 'schema:BoatTrip',
	name: 'BoatTrip',
	label: 'BoatTrip',
	comment: 'A trip on a commercial ferry line.',
	subClassOf: ['Trip', 'Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:arrivalBoatTerminal',
			name: 'arrivalBoatTerminal',
			label: 'arrivalBoatTerminal',
			comment: 'The terminal or port from which the boat arrives.',
			rangeIncludes: ['BoatTerminal'],
		},
		{
			id: 'schema:departureBoatTerminal',
			name: 'departureBoatTerminal',
			label: 'departureBoatTerminal',
			comment: 'The terminal or port from which the boat departs.',
			rangeIncludes: ['BoatTerminal'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgBoatTrip;
export const BoatTrip = schemaOrgBoatTrip;

export default schemaOrgBoatTrip;
