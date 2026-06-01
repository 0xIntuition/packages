import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgTaxiReservation = {
	id: 'schema:TaxiReservation',
	name: 'TaxiReservation',
	label: 'TaxiReservation',
	comment:
		'A reservation for a taxi.\\n\\nNote: This type is for information about actual reservations, e.g. in confirmation emails or HTML pages with individual confirmations of reservations. For offers of tickets, use [[Offer]].',
	subClassOf: ['Reservation', 'Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:partySize',
			name: 'partySize',
			label: 'partySize',
			comment: 'Number of people the reservation should accommodate.',
			rangeIncludes: ['Integer', 'QuantitativeValue'],
		},
		{
			id: 'schema:pickupLocation',
			name: 'pickupLocation',
			label: 'pickupLocation',
			comment: 'Where a taxi will pick up a passenger or a rental car can be picked up.',
			rangeIncludes: ['Place'],
		},
		{
			id: 'schema:pickupTime',
			name: 'pickupTime',
			label: 'pickupTime',
			comment: 'When a taxi will pick up a passenger or a rental car can be picked up.',
			rangeIncludes: ['DateTime'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgTaxiReservation;
export const TaxiReservation = schemaOrgTaxiReservation;

export default schemaOrgTaxiReservation;
