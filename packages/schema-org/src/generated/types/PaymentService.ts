import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgPaymentService = {
	id: 'schema:PaymentService',
	name: 'PaymentService',
	label: 'PaymentService',
	comment:
		'A Service to transfer funds from a person or organization to a beneficiary person or organization.',
	subClassOf: ['FinancialProduct', 'Service', 'Intangible', 'Thing', 'PaymentMethod'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgPaymentService;
export const PaymentService = schemaOrgPaymentService;

export default schemaOrgPaymentService;
