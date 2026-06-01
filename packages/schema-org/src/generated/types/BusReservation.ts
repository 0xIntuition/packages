import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgBusReservation = {
	id: 'schema:BusReservation',
	name: 'BusReservation',
	label: 'BusReservation',
	comment:
		'A reservation for bus travel. \\n\\nNote: This type is for information about actual reservations, e.g. in confirmation emails or HTML pages with individual confirmations of reservations. For offers of tickets, use [[Offer]].',
	subClassOf: ['Reservation', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgBusReservation;
export const BusReservation = schemaOrgBusReservation;

export default schemaOrgBusReservation;
