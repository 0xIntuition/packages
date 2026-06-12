import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgReturnLabelSourceEnumeration = {
	id: 'schema:ReturnLabelSourceEnumeration',
	name: 'ReturnLabelSourceEnumeration',
	label: 'ReturnLabelSourceEnumeration',
	comment: 'Enumerates several types of return labels for product returns.',
	subClassOf: ['Enumeration', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgReturnLabelSourceEnumeration;
export const ReturnLabelSourceEnumeration = schemaOrgReturnLabelSourceEnumeration;

export default schemaOrgReturnLabelSourceEnumeration;
