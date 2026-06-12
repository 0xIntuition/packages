import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgReservation = {
	id: 'schema:Reservation',
	name: 'Reservation',
	label: 'Reservation',
	comment:
		'Describes a reservation for travel, dining or an event. Some reservations require tickets. \\n\\nNote: This type is for information about actual reservations, e.g. in confirmation emails or HTML pages with individual confirmations of reservations. For offers of tickets, restaurant reservations, flights, or rental cars, use [[Offer]].',
	subClassOf: ['Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:bookingAgent',
			name: 'bookingAgent',
			label: 'bookingAgent',
			comment:
				"'bookingAgent' is an out-dated term indicating a 'broker' that serves as a booking agent.",
			rangeIncludes: ['Organization', 'Person'],
		},
		{
			id: 'schema:bookingTime',
			name: 'bookingTime',
			label: 'bookingTime',
			comment: 'The date and time the reservation was booked.',
			rangeIncludes: ['DateTime'],
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
			id: 'schema:modifiedTime',
			name: 'modifiedTime',
			label: 'modifiedTime',
			comment: 'The date and time the reservation was modified.',
			rangeIncludes: ['DateTime'],
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
			id: 'schema:programMembershipUsed',
			name: 'programMembershipUsed',
			label: 'programMembershipUsed',
			comment:
				'Any membership in a frequent flyer, hotel loyalty program, etc. being applied to the reservation.',
			rangeIncludes: ['ProgramMembership'],
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
			id: 'schema:reservationFor',
			name: 'reservationFor',
			label: 'reservationFor',
			comment: 'The thing -- flight, event, restaurant, etc. being reserved.',
			rangeIncludes: ['Thing'],
		},
		{
			id: 'schema:reservationId',
			name: 'reservationId',
			label: 'reservationId',
			comment: 'A unique identifier for the reservation.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:reservationStatus',
			name: 'reservationStatus',
			label: 'reservationStatus',
			comment: 'The current status of the reservation.',
			rangeIncludes: ['ReservationStatusType'],
		},
		{
			id: 'schema:reservedTicket',
			name: 'reservedTicket',
			label: 'reservedTicket',
			comment: 'A ticket associated with the reservation.',
			rangeIncludes: ['Ticket'],
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

export const spec = schemaOrgReservation;
export const Reservation = schemaOrgReservation;

export default schemaOrgReservation;
