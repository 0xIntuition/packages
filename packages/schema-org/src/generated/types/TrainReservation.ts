import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgTrainReservation = {
	id: 'schema:TrainReservation',
	name: 'TrainReservation',
	label: 'TrainReservation',
	comment:
		'A reservation for train travel.\\n\\nNote: This type is for information about actual reservations, e.g. in confirmation emails or HTML pages with individual confirmations of reservations. For offers of tickets, use [[Offer]].',
	subClassOf: ['Reservation', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgTrainReservation;
export const TrainReservation = schemaOrgTrainReservation;

export default schemaOrgTrainReservation;
