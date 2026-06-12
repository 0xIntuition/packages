import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgReturnMethodEnumeration = {
	id: 'schema:ReturnMethodEnumeration',
	name: 'ReturnMethodEnumeration',
	label: 'ReturnMethodEnumeration',
	comment: 'Enumerates several types of product return methods.',
	subClassOf: ['Enumeration', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgReturnMethodEnumeration;
export const ReturnMethodEnumeration = schemaOrgReturnMethodEnumeration;

export default schemaOrgReturnMethodEnumeration;
