import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgRentalCarReservation = {
	id: 'schema:RentalCarReservation',
	name: 'RentalCarReservation',
	label: 'RentalCarReservation',
	comment:
		'A reservation for a rental car.\\n\\nNote: This type is for information about actual reservations, e.g. in confirmation emails or HTML pages with individual confirmations of reservations.',
	subClassOf: ['Reservation', 'Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:dropoffLocation',
			name: 'dropoffLocation',
			label: 'dropoffLocation',
			comment: 'Where a rental car can be dropped off.',
			rangeIncludes: ['Place'],
		},
		{
			id: 'schema:dropoffTime',
			name: 'dropoffTime',
			label: 'dropoffTime',
			comment: 'When a rental car can be dropped off.',
			rangeIncludes: ['DateTime'],
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

export const spec = schemaOrgRentalCarReservation;
export const RentalCarReservation = schemaOrgRentalCarReservation;

export default schemaOrgRentalCarReservation;
