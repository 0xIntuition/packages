import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgBoatReservation = {
	id: 'schema:BoatReservation',
	name: 'BoatReservation',
	label: 'BoatReservation',
	comment:
		'A reservation for boat travel.\n\nNote: This type is for information about actual reservations, e.g. in confirmation emails or HTML pages with individual confirmations of reservations. For offers of tickets, use [[Offer]].',
	subClassOf: ['Reservation', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgBoatReservation;
export const BoatReservation = schemaOrgBoatReservation;

export default schemaOrgBoatReservation;
