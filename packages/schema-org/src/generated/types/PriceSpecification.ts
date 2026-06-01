import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgPriceSpecification = {
	id: 'schema:PriceSpecification',
	name: 'PriceSpecification',
	label: 'PriceSpecification',
	comment:
		'A structured value representing a price or price range. Typically, only the subclasses of this type are used for markup. It is recommended to use [[MonetaryAmount]] to describe independent amounts of money such as a salary, credit card limits, etc.',
	subClassOf: ['StructuredValue', 'Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:eligibleQuantity',
			name: 'eligibleQuantity',
			label: 'eligibleQuantity',
			comment:
				'The interval and unit of measurement of ordering quantities for which the offer or price specification is valid. This allows e.g. specifying that a certain freight charge is valid only for a certain quantity.',
			rangeIncludes: ['QuantitativeValue'],
		},
		{
			id: 'schema:eligibleTransactionVolume',
			name: 'eligibleTransactionVolume',
			label: 'eligibleTransactionVolume',
			comment:
				'The transaction volume, in a monetary unit, for which the offer or price specification is valid, e.g. for indicating a minimal purchasing volume, to express free shipping above a certain order volume, or to limit the acceptance of credit cards to purchases to a certain minimal amount.',
			rangeIncludes: ['PriceSpecification'],
		},
		{
			id: 'schema:maxPrice',
			name: 'maxPrice',
			label: 'maxPrice',
			comment: 'The highest price if the price is a range.',
			rangeIncludes: ['Number'],
		},
		{
			id: 'schema:membershipPointsEarned',
			name: 'membershipPointsEarned',
			label: 'membershipPointsEarned',
			comment:
				'The number of membership points earned by the member. If necessary, the unitText can be used to express the units the points are issued in. (E.g. stars, miles, etc.)',
			rangeIncludes: ['Number', 'QuantitativeValue'],
		},
		{
			id: 'schema:minPrice',
			name: 'minPrice',
			label: 'minPrice',
			comment: 'The lowest price if the price is a range.',
			rangeIncludes: ['Number'],
		},
		{
			id: 'schema:price',
			name: 'price',
			label: 'price',
			comment:
				"The offer price of a product, or of a price component when attached to PriceSpecification and its subtypes.\\n\\nUsage guidelines:\\n\\n* Use the [[priceCurrency]] property (with standard formats: [ISO 4217 currency format](http://en.wikipedia.org/wiki/ISO_4217), e.g. \"USD\"; [Ticker symbol](https://en.wikipedia.org/wiki/List_of_cryptocurrencies) for cryptocurrencies, e.g. \"BTC\"; well known names for [Local Exchange Trading Systems](https://en.wikipedia.org/wiki/Local_exchange_trading_system) (LETS) and other currency types, e.g. \"Ithaca HOUR\") instead of including [ambiguous symbols](http://en.wikipedia.org/wiki/Dollar_sign#Currencies_that_use_the_dollar_or_peso_sign) such as '$' in the value.\\n* Use '.' (Unicode 'FULL STOP' (U+002E)) rather than ',' to indicate a decimal point. Avoid using these symbols as a readability separator.\\n* Note that both [RDFa](http://www.w3.org/TR/xhtml-rdfa-primer/#using-the-content-attribute) and Microdata syntax allow the use of a \"content=\" attribute for publishing simple machine-readable values alongside more human-friendly formatting.\\n* Use values from 0123456789 (Unicode 'DIGIT ZERO' (U+0030) to 'DIGIT NINE' (U+0039)) rather than superficially similar Unicode symbols.\n      ",
			rangeIncludes: ['Number', 'Text'],
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
			id: 'schema:validForMemberTier',
			name: 'validForMemberTier',
			label: 'validForMemberTier',
			comment:
				'The membership program tier(s) an Offer (or a PriceSpecification, OfferShippingDetails, or MerchantReturnPolicy under an Offer) is valid for.',
			rangeIncludes: ['MemberProgramTier'],
		},
		{
			id: 'schema:validFrom',
			name: 'validFrom',
			label: 'validFrom',
			comment: 'The date when the item becomes valid.',
			rangeIncludes: ['Date', 'DateTime'],
		},
		{
			id: 'schema:validThrough',
			name: 'validThrough',
			label: 'validThrough',
			comment:
				'The date after when the item is not valid. For example the end of an offer, salary period, or a period of opening hours.',
			rangeIncludes: ['Date', 'DateTime'],
		},
		{
			id: 'schema:valueAddedTaxIncluded',
			name: 'valueAddedTaxIncluded',
			label: 'valueAddedTaxIncluded',
			comment:
				'Specifies whether the applicable value-added tax (VAT) is included in the price specification or not.',
			rangeIncludes: ['Boolean'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgPriceSpecification;
export const PriceSpecification = schemaOrgPriceSpecification;

export default schemaOrgPriceSpecification;
