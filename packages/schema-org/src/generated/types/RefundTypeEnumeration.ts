import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgRefundTypeEnumeration = {
	id: 'schema:RefundTypeEnumeration',
	name: 'RefundTypeEnumeration',
	label: 'RefundTypeEnumeration',
	comment: 'Enumerates several kinds of product return refund types.',
	subClassOf: ['Enumeration', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgRefundTypeEnumeration;
export const RefundTypeEnumeration = schemaOrgRefundTypeEnumeration;

export default schemaOrgRefundTypeEnumeration;
