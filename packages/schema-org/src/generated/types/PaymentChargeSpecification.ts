import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgPaymentChargeSpecification = {
	id: 'schema:PaymentChargeSpecification',
	name: 'PaymentChargeSpecification',
	label: 'PaymentChargeSpecification',
	comment: 'The costs of settling the payment using a particular payment method.',
	subClassOf: ['PriceSpecification', 'StructuredValue', 'Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:appliesToDeliveryMethod',
			name: 'appliesToDeliveryMethod',
			label: 'appliesToDeliveryMethod',
			comment:
				'The delivery method(s) to which the delivery charge or payment charge specification applies.',
			rangeIncludes: ['DeliveryMethod'],
		},
		{
			id: 'schema:appliesToPaymentMethod',
			name: 'appliesToPaymentMethod',
			label: 'appliesToPaymentMethod',
			comment: 'The payment method(s) to which the payment charge specification applies.',
			rangeIncludes: ['PaymentMethod'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgPaymentChargeSpecification;
export const PaymentChargeSpecification = schemaOrgPaymentChargeSpecification;

export default schemaOrgPaymentChargeSpecification;
