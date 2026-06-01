import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgPaymentMethodType = {
	id: 'schema:PaymentMethodType',
	name: 'PaymentMethodType',
	label: 'PaymentMethodType',
	comment:
		'The type of payment method, only for generic payment types, specific forms of payments, like card payment should be expressed using subclasses of PaymentMethod.',
	subClassOf: ['Enumeration', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgPaymentMethodType;
export const PaymentMethodType = schemaOrgPaymentMethodType;

export default schemaOrgPaymentMethodType;
