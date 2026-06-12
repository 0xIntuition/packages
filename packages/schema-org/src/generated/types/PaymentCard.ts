import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgPaymentCard = {
	id: 'schema:PaymentCard',
	name: 'PaymentCard',
	label: 'PaymentCard',
	comment:
		'A payment method using a credit, debit, store or other card to associate the payment with an account.',
	subClassOf: ['FinancialProduct', 'PaymentMethod', 'Service', 'Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:cashBack',
			name: 'cashBack',
			label: 'cashBack',
			comment:
				'A cardholder benefit that pays the cardholder a small percentage of their net expenditures.',
			rangeIncludes: ['Boolean', 'Number'],
		},
		{
			id: 'schema:contactlessPayment',
			name: 'contactlessPayment',
			label: 'contactlessPayment',
			comment:
				'A secure method for consumers to purchase products or services via debit, credit or smartcards by using RFID or NFC technology.',
			rangeIncludes: ['Boolean'],
		},
		{
			id: 'schema:floorLimit',
			name: 'floorLimit',
			label: 'floorLimit',
			comment:
				'A floor limit is the amount of money above which credit card transactions must be authorized.',
			rangeIncludes: ['MonetaryAmount'],
		},
		{
			id: 'schema:monthlyMinimumRepaymentAmount',
			name: 'monthlyMinimumRepaymentAmount',
			label: 'monthlyMinimumRepaymentAmount',
			comment:
				'The minimum payment is the lowest amount of money that one is required to pay on a credit card statement each month.',
			rangeIncludes: ['MonetaryAmount', 'Number'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgPaymentCard;
export const PaymentCard = schemaOrgPaymentCard;

export default schemaOrgPaymentCard;
