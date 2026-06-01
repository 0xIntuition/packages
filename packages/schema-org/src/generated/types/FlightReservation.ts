import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgFlightReservation = {
	id: 'schema:FlightReservation',
	name: 'FlightReservation',
	label: 'FlightReservation',
	comment:
		'A reservation for air travel.\\n\\nNote: This type is for information about actual reservations, e.g. in confirmation emails or HTML pages with individual confirmations of reservations. For offers of tickets, use [[Offer]].',
	subClassOf: ['Reservation', 'Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:boardingGroup',
			name: 'boardingGroup',
			label: 'boardingGroup',
			comment: 'The airline-specific indicator of boarding order / preference.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:passengerPriorityStatus',
			name: 'passengerPriorityStatus',
			label: 'passengerPriorityStatus',
			comment:
				'The priority status assigned to a passenger for security or boarding (e.g. FastTrack or Priority).',
			rangeIncludes: ['QualitativeValue', 'Text'],
		},
		{
			id: 'schema:passengerSequenceNumber',
			name: 'passengerSequenceNumber',
			label: 'passengerSequenceNumber',
			comment: "The passenger's sequence number as assigned by the airline.",
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:securityScreening',
			name: 'securityScreening',
			label: 'securityScreening',
			comment: 'The type of security screening the passenger is subject to.',
			rangeIncludes: ['Text'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgFlightReservation;
export const FlightReservation = schemaOrgFlightReservation;

export default schemaOrgFlightReservation;
