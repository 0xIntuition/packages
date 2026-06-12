import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgEventAttendanceModeEnumeration = {
	id: 'schema:EventAttendanceModeEnumeration',
	name: 'EventAttendanceModeEnumeration',
	label: 'EventAttendanceModeEnumeration',
	comment:
		'An EventAttendanceModeEnumeration value is one of potentially several modes of organising an event, relating to whether it is online or offline.',
	subClassOf: ['Enumeration', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgEventAttendanceModeEnumeration;
export const EventAttendanceModeEnumeration = schemaOrgEventAttendanceModeEnumeration;

export default schemaOrgEventAttendanceModeEnumeration;
