import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgInvoice = {
	id: 'schema:Invoice',
	name: 'Invoice',
	label: 'Invoice',
	comment: 'A statement of the money due for goods or services; a bill.',
	subClassOf: ['Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:accountId',
			name: 'accountId',
			label: 'accountId',
			comment: 'The identifier for the account the payment will be applied to.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:billingPeriod',
			name: 'billingPeriod',
			label: 'billingPeriod',
			comment: 'The time interval used to compute the invoice.',
			rangeIncludes: ['Duration'],
		},
		{
			id: 'schema:broker',
			name: 'broker',
			label: 'broker',
			comment:
				'An entity that arranges for an exchange between a buyer and a seller.  In most cases a broker never acquires or releases ownership of a product or service involved in an exchange.  If it is not clear whether an entity is a broker, seller, or buyer, the latter two terms are preferred.',
			rangeIncludes: ['Organization', 'Person'],
		},
		{
			id: 'schema:category',
			name: 'category',
			label: 'category',
			comment:
				'A category for the item. Greater signs or slashes can be used to informally indicate a category hierarchy.',
			rangeIncludes: ['CategoryCode', 'PhysicalActivityCategory', 'Text', 'Thing', 'URL'],
		},
		{
			id: 'schema:confirmationNumber',
			name: 'confirmationNumber',
			label: 'confirmationNumber',
			comment: 'A number that confirms the given order or payment has been received.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:customer',
			name: 'customer',
			label: 'customer',
			comment: 'Party placing the order or paying the invoice.',
			rangeIncludes: ['Organization', 'Person'],
		},
		{
			id: 'schema:minimumPaymentDue',
			name: 'minimumPaymentDue',
			label: 'minimumPaymentDue',
			comment: 'The minimum payment required at this time.',
			rangeIncludes: ['MonetaryAmount', 'PriceSpecification'],
		},
		{
			id: 'schema:paymentDue',
			name: 'paymentDue',
			label: 'paymentDue',
			comment: 'The date that payment is due.',
			rangeIncludes: ['DateTime'],
		},
		{
			id: 'schema:paymentDueDate',
			name: 'paymentDueDate',
			label: 'paymentDueDate',
			comment: 'The date that payment is due.',
			rangeIncludes: ['Date', 'DateTime'],
		},
		{
			id: 'schema:paymentMethod',
			name: 'paymentMethod',
			label: 'paymentMethod',
			comment: 'The name of the credit card or other method of payment for the order.',
			rangeIncludes: ['PaymentMethod', 'Text'],
		},
		{
			id: 'schema:paymentMethodId',
			name: 'paymentMethodId',
			label: 'paymentMethodId',
			comment:
				'An identifier for the method of payment used (e.g. the last 4 digits of the credit card).',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:paymentStatus',
			name: 'paymentStatus',
			label: 'paymentStatus',
			comment: 'The status of payment; whether the invoice has been paid or not.',
			rangeIncludes: ['PaymentStatusType', 'Text'],
		},
		{
			id: 'schema:provider',
			name: 'provider',
			label: 'provider',
			comment:
				'The service provider, service operator, or service performer; the goods producer. Another party (a seller) may offer those services or goods on behalf of the provider. A provider may also serve as the seller.',
			rangeIncludes: ['Organization', 'Person'],
		},
		{
			id: 'schema:referencesOrder',
			name: 'referencesOrder',
			label: 'referencesOrder',
			comment:
				'The Order(s) related to this Invoice. One or more Orders may be combined into a single Invoice.',
			rangeIncludes: ['Order'],
		},
		{
			id: 'schema:scheduledPaymentDate',
			name: 'scheduledPaymentDate',
			label: 'scheduledPaymentDate',
			comment: 'The date the invoice is scheduled to be paid.',
			rangeIncludes: ['Date'],
		},
		{
			id: 'schema:totalPaymentDue',
			name: 'totalPaymentDue',
			label: 'totalPaymentDue',
			comment: 'The total amount due.',
			rangeIncludes: ['MonetaryAmount', 'PriceSpecification'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgInvoice;
export const Invoice = schemaOrgInvoice;

export default schemaOrgInvoice;
