import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgEventReservation = {
	id: 'schema:EventReservation',
	name: 'EventReservation',
	label: 'EventReservation',
	comment:
		'A reservation for an event like a concert, sporting event, or lecture.\\n\\nNote: This type is for information about actual reservations, e.g. in confirmation emails or HTML pages with individual confirmations of reservations. For offers of tickets, use [[Offer]].',
	subClassOf: ['Reservation', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgEventReservation;
export const EventReservation = schemaOrgEventReservation;

export default schemaOrgEventReservation;
