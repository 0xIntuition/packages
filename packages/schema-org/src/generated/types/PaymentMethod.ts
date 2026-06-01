import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgPaymentMethod = {
	id: 'schema:PaymentMethod',
	name: 'PaymentMethod',
	label: 'PaymentMethod',
	comment:
		'A payment method is a standardized procedure for transferring the monetary amount for a purchase. Payment methods are characterized by the legal and technical structures used, and by the organization or group carrying out the transaction. The following legacy values should be accepted: \\n\\n* http://purl.org/goodrelations/v1#ByBankTransferInAdvance\\n* http://purl.org/goodrelations/v1#ByInvoice\\n* http://purl.org/goodrelations/v1#Cash\\n* http://purl.org/goodrelations/v1#CheckInAdvance\\n* http://purl.org/goodrelations/v1#COD\\n* http://purl.org/goodrelations/v1#DirectDebit\\n* http://purl.org/goodrelations/v1#GoogleCheckout\\n* http://purl.org/goodrelations/v1#PayPal\\n* http://purl.org/goodrelations/v1#PaySwarm\\n\\nStructured values, or [UNCE payment means](https://vocabulary.uncefact.org/PaymentMeans) are recommended or for newer annotations.',
	subClassOf: ['Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:paymentMethodType',
			name: 'paymentMethodType',
			label: 'paymentMethodType',
			comment: 'The type of a payment method.',
			rangeIncludes: ['PaymentMethodType'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgPaymentMethod;
export const PaymentMethod = schemaOrgPaymentMethod;

export default schemaOrgPaymentMethod;
