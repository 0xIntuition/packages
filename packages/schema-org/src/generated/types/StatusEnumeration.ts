import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgStatusEnumeration = {
	id: 'schema:StatusEnumeration',
	name: 'StatusEnumeration',
	label: 'StatusEnumeration',
	comment: 'Lists or enumerations dealing with status types.',
	subClassOf: ['Enumeration', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgStatusEnumeration;
export const StatusEnumeration = schemaOrgStatusEnumeration;

export default schemaOrgStatusEnumeration;
