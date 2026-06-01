import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgOrder = {
	id: 'schema:Order',
	name: 'Order',
	label: 'Order',
	comment:
		'An order is a confirmation of a transaction (a receipt), which can contain multiple line items, each represented by an Offer that has been accepted by the customer.',
	subClassOf: ['Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:acceptedOffer',
			name: 'acceptedOffer',
			label: 'acceptedOffer',
			comment:
				'The offer(s) -- e.g., product, quantity and price combinations -- included in the order.',
			rangeIncludes: ['Offer'],
		},
		{
			id: 'schema:billingAddress',
			name: 'billingAddress',
			label: 'billingAddress',
			comment: 'The billing address for the order.',
			rangeIncludes: ['PostalAddress'],
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
			id: 'schema:discount',
			name: 'discount',
			label: 'discount',
			comment: 'Any discount applied (to an Order).',
			rangeIncludes: ['Number', 'Text'],
		},
		{
			id: 'schema:discountCode',
			name: 'discountCode',
			label: 'discountCode',
			comment: 'Code used to redeem a discount.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:discountCurrency',
			name: 'discountCurrency',
			label: 'discountCurrency',
			comment:
				'The currency of the discount.\\n\\nUse standard formats: [ISO 4217 currency format](http://en.wikipedia.org/wiki/ISO_4217), e.g. "USD"; [Ticker symbol](https://en.wikipedia.org/wiki/List_of_cryptocurrencies) for cryptocurrencies, e.g. "BTC"; well known names for [Local Exchange Trading Systems](https://en.wikipedia.org/wiki/Local_exchange_trading_system) (LETS) and other currency types, e.g. "Ithaca HOUR".',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:isGift',
			name: 'isGift',
			label: 'isGift',
			comment:
				'Indicates whether the offer was accepted as a gift for someone other than the buyer.',
			rangeIncludes: ['Boolean'],
		},
		{
			id: 'schema:merchant',
			name: 'merchant',
			label: 'merchant',
			comment: "'merchant' is an out-dated term for 'seller'.",
			rangeIncludes: ['Organization', 'Person'],
		},
		{
			id: 'schema:orderDate',
			name: 'orderDate',
			label: 'orderDate',
			comment: 'Date order was placed.',
			rangeIncludes: ['Date', 'DateTime'],
		},
		{
			id: 'schema:orderDelivery',
			name: 'orderDelivery',
			label: 'orderDelivery',
			comment: 'The delivery of the parcel related to this order or order item.',
			rangeIncludes: ['ParcelDelivery'],
		},
		{
			id: 'schema:orderNumber',
			name: 'orderNumber',
			label: 'orderNumber',
			comment: 'The identifier of the transaction.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:orderStatus',
			name: 'orderStatus',
			label: 'orderStatus',
			comment: 'The current status of the order.',
			rangeIncludes: ['OrderStatus'],
		},
		{
			id: 'schema:orderedItem',
			name: 'orderedItem',
			label: 'orderedItem',
			comment: 'The item ordered.',
			rangeIncludes: ['OrderItem', 'Product', 'Service'],
		},
		{
			id: 'schema:partOfInvoice',
			name: 'partOfInvoice',
			label: 'partOfInvoice',
			comment: 'The order is being paid as part of the referenced Invoice.',
			rangeIncludes: ['Invoice'],
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
			id: 'schema:paymentUrl',
			name: 'paymentUrl',
			label: 'paymentUrl',
			comment: 'The URL for sending a payment.',
			rangeIncludes: ['URL'],
		},
		{
			id: 'schema:seller',
			name: 'seller',
			label: 'seller',
			comment:
				'An entity which offers (sells / leases / lends / loans) the services / goods.  A seller may also be a provider.',
			rangeIncludes: ['Organization', 'Person'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgOrder;
export const Order = schemaOrgOrder;

export default schemaOrgOrder;
