import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgEventStatusType = {
	id: 'schema:EventStatusType',
	name: 'EventStatusType',
	label: 'EventStatusType',
	comment:
		'EventStatusType is an enumeration type whose instances represent several states that an Event may be in.',
	subClassOf: ['StatusEnumeration', 'Enumeration', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgEventStatusType;
export const EventStatusType = schemaOrgEventStatusType;

export default schemaOrgEventStatusType;
