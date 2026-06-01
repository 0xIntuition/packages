import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgReservationStatusType = {
	id: 'schema:ReservationStatusType',
	name: 'ReservationStatusType',
	label: 'ReservationStatusType',
	comment: 'Enumerated status values for Reservation.',
	subClassOf: ['StatusEnumeration', 'Enumeration', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgReservationStatusType;
export const ReservationStatusType = schemaOrgReservationStatusType;

export default schemaOrgReservationStatusType;
