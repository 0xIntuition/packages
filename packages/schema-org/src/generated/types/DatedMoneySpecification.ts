import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgDatedMoneySpecification = {
	id: 'schema:DatedMoneySpecification',
	name: 'DatedMoneySpecification',
	label: 'DatedMoneySpecification',
	comment:
		"A DatedMoneySpecification represents monetary values with optional start and end dates. For example, this could represent an employee's salary over a specific period of time. __Note:__ This type has been superseded by [[MonetaryAmount]], use of that type is recommended.",
	subClassOf: ['StructuredValue', 'Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:amount',
			name: 'amount',
			label: 'amount',
			comment: 'The amount of money.',
			rangeIncludes: ['MonetaryAmount', 'Number'],
		},
		{
			id: 'schema:currency',
			name: 'currency',
			label: 'currency',
			comment:
				'The currency in which the monetary amount is expressed.\\n\\nUse standard formats: [ISO 4217 currency format](http://en.wikipedia.org/wiki/ISO_4217), e.g. "USD"; [Ticker symbol](https://en.wikipedia.org/wiki/List_of_cryptocurrencies) for cryptocurrencies, e.g. "BTC"; well known names for [Local Exchange Trading Systems](https://en.wikipedia.org/wiki/Local_exchange_trading_system) (LETS) and other currency types, e.g. "Ithaca HOUR".',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:endDate',
			name: 'endDate',
			label: 'endDate',
			comment:
				'The end date and time of the item (in [ISO 8601 date format](http://en.wikipedia.org/wiki/ISO_8601)).',
			rangeIncludes: ['Date', 'DateTime'],
		},
		{
			id: 'schema:startDate',
			name: 'startDate',
			label: 'startDate',
			comment:
				'The start date and time of the item (in [ISO 8601 date format](http://en.wikipedia.org/wiki/ISO_8601)).',
			rangeIncludes: ['Date', 'DateTime'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgDatedMoneySpecification;
export const DatedMoneySpecification = schemaOrgDatedMoneySpecification;

export default schemaOrgDatedMoneySpecification;
