import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMonetaryAmountDistribution = {
	id: 'schema:MonetaryAmountDistribution',
	name: 'MonetaryAmountDistribution',
	label: 'MonetaryAmountDistribution',
	comment: 'A statistical distribution of monetary amounts.',
	subClassOf: ['QuantitativeValueDistribution', 'StructuredValue', 'Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:currency',
			name: 'currency',
			label: 'currency',
			comment:
				'The currency in which the monetary amount is expressed.\\n\\nUse standard formats: [ISO 4217 currency format](http://en.wikipedia.org/wiki/ISO_4217), e.g. "USD"; [Ticker symbol](https://en.wikipedia.org/wiki/List_of_cryptocurrencies) for cryptocurrencies, e.g. "BTC"; well known names for [Local Exchange Trading Systems](https://en.wikipedia.org/wiki/Local_exchange_trading_system) (LETS) and other currency types, e.g. "Ithaca HOUR".',
			rangeIncludes: ['Text'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgMonetaryAmountDistribution;
export const MonetaryAmountDistribution = schemaOrgMonetaryAmountDistribution;

export default schemaOrgMonetaryAmountDistribution;
