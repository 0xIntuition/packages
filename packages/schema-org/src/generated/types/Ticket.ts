import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgTicket = {
	id: 'schema:Ticket',
	name: 'Ticket',
	label: 'Ticket',
	comment: 'Used to describe a ticket to an event, a flight, a bus ride, etc.',
	subClassOf: ['Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:dateIssued',
			name: 'dateIssued',
			label: 'dateIssued',
			comment: 'The date the ticket was issued.',
			rangeIncludes: ['Date', 'DateTime'],
		},
		{
			id: 'schema:issuedBy',
			name: 'issuedBy',
			label: 'issuedBy',
			comment:
				'The organization issuing the item, for example a [[Permit]], [[Ticket]], or [[Certification]].',
			rangeIncludes: ['Organization'],
		},
		{
			id: 'schema:priceCurrency',
			name: 'priceCurrency',
			label: 'priceCurrency',
			comment:
				'The currency of the price, or a price component when attached to [[PriceSpecification]] and its subtypes.\\n\\nUse standard formats: [ISO 4217 currency format](http://en.wikipedia.org/wiki/ISO_4217), e.g. "USD"; [Ticker symbol](https://en.wikipedia.org/wiki/List_of_cryptocurrencies) for cryptocurrencies, e.g. "BTC"; well known names for [Local Exchange Trading Systems](https://en.wikipedia.org/wiki/Local_exchange_trading_system) (LETS) and other currency types, e.g. "Ithaca HOUR".',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:ticketNumber',
			name: 'ticketNumber',
			label: 'ticketNumber',
			comment: 'The unique identifier for the ticket.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:ticketToken',
			name: 'ticketToken',
			label: 'ticketToken',
			comment: 'Reference to an asset (e.g., Barcode, QR code image or PDF) usable for entrance.',
			rangeIncludes: ['Text', 'URL'],
		},
		{
			id: 'schema:ticketedSeat',
			name: 'ticketedSeat',
			label: 'ticketedSeat',
			comment: 'The seat associated with the ticket.',
			rangeIncludes: ['Seat'],
		},
		{
			id: 'schema:totalPrice',
			name: 'totalPrice',
			label: 'totalPrice',
			comment:
				"The total price for the reservation or ticket, including applicable taxes, shipping, etc.\\n\\nUsage guidelines:\\n\\n* Use values from 0123456789 (Unicode 'DIGIT ZERO' (U+0030) to 'DIGIT NINE' (U+0039)) rather than superficially similar Unicode symbols.\\n* Use '.' (Unicode 'FULL STOP' (U+002E)) rather than ',' to indicate a decimal point. Avoid using these symbols as a readability separator.",
			rangeIncludes: ['Number', 'PriceSpecification', 'Text'],
		},
		{
			id: 'schema:underName',
			name: 'underName',
			label: 'underName',
			comment: 'The person or organization the reservation or ticket is for.',
			rangeIncludes: ['Organization', 'Person'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgTicket;
export const Ticket = schemaOrgTicket;

export default schemaOrgTicket;
