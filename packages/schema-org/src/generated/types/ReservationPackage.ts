import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgReservationPackage = {
	id: 'schema:ReservationPackage',
	name: 'ReservationPackage',
	label: 'ReservationPackage',
	comment: 'A group of multiple reservations with common values for all sub-reservations.',
	subClassOf: ['Reservation', 'Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:subReservation',
			name: 'subReservation',
			label: 'subReservation',
			comment:
				'The individual reservations included in the package. Typically a repeated property.',
			rangeIncludes: ['Reservation'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgReservationPackage;
export const ReservationPackage = schemaOrgReservationPackage;

export default schemaOrgReservationPackage;
