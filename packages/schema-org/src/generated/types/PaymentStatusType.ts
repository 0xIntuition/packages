import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgPaymentStatusType = {
	id: 'schema:PaymentStatusType',
	name: 'PaymentStatusType',
	label: 'PaymentStatusType',
	comment: 'A specific payment status. For example, PaymentDue, PaymentComplete, etc.',
	subClassOf: ['StatusEnumeration', 'Enumeration', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgPaymentStatusType;
export const PaymentStatusType = schemaOrgPaymentStatusType;

export default schemaOrgPaymentStatusType;
