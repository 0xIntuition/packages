import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgReturnFeesEnumeration = {
	id: 'schema:ReturnFeesEnumeration',
	name: 'ReturnFeesEnumeration',
	label: 'ReturnFeesEnumeration',
	comment: 'Enumerates several kinds of policies for product return fees.',
	subClassOf: ['Enumeration', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgReturnFeesEnumeration;
export const ReturnFeesEnumeration = schemaOrgReturnFeesEnumeration;

export default schemaOrgReturnFeesEnumeration;
