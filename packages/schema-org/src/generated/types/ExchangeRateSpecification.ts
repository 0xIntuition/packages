import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgExchangeRateSpecification = {
	id: 'schema:ExchangeRateSpecification',
	name: 'ExchangeRateSpecification',
	label: 'ExchangeRateSpecification',
	comment: 'A structured value representing exchange rate.',
	subClassOf: ['StructuredValue', 'Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:currency',
			name: 'currency',
			label: 'currency',
			comment:
				'The currency in which the monetary amount is expressed.\\n\\nUse standard formats: [ISO 4217 currency format](http://en.wikipedia.org/wiki/ISO_4217), e.g. "USD"; [Ticker symbol](https://en.wikipedia.org/wiki/List_of_cryptocurrencies) for cryptocurrencies, e.g. "BTC"; well known names for [Local Exchange Trading Systems](https://en.wikipedia.org/wiki/Local_exchange_trading_system) (LETS) and other currency types, e.g. "Ithaca HOUR".',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:currentExchangeRate',
			name: 'currentExchangeRate',
			label: 'currentExchangeRate',
			comment: 'The current price of a currency.',
			rangeIncludes: ['UnitPriceSpecification'],
		},
		{
			id: 'schema:exchangeRateSpread',
			name: 'exchangeRateSpread',
			label: 'exchangeRateSpread',
			comment:
				'The difference between the price at which a broker or other intermediary buys and sells foreign currency.',
			rangeIncludes: ['MonetaryAmount', 'Number'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgExchangeRateSpecification;
export const ExchangeRateSpecification = schemaOrgExchangeRateSpecification;

export default schemaOrgExchangeRateSpecification;
