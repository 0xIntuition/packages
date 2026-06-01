import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgLoanOrCredit = {
	id: 'schema:LoanOrCredit',
	name: 'LoanOrCredit',
	label: 'LoanOrCredit',
	comment:
		'A financial product for the loaning of an amount of money, or line of credit, under agreed terms and charges.',
	subClassOf: ['FinancialProduct', 'Service', 'Intangible', 'Thing'],
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
			id: 'schema:gracePeriod',
			name: 'gracePeriod',
			label: 'gracePeriod',
			comment:
				'The period of time after any due date that the borrower has to fulfil its obligations before a default (failure to pay) is deemed to have occurred.',
			rangeIncludes: ['Duration'],
		},
		{
			id: 'schema:loanRepaymentForm',
			name: 'loanRepaymentForm',
			label: 'loanRepaymentForm',
			comment:
				'A form of paying back money previously borrowed from a lender. Repayment usually takes the form of periodic payments that normally include part principal plus interest in each payment.',
			rangeIncludes: ['RepaymentSpecification'],
		},
		{
			id: 'schema:loanTerm',
			name: 'loanTerm',
			label: 'loanTerm',
			comment: 'The duration of the loan or credit agreement.',
			rangeIncludes: ['QuantitativeValue'],
		},
		{
			id: 'schema:loanType',
			name: 'loanType',
			label: 'loanType',
			comment: 'The type of a loan or credit.',
			rangeIncludes: ['Text', 'URL'],
		},
		{
			id: 'schema:recourseLoan',
			name: 'recourseLoan',
			label: 'recourseLoan',
			comment:
				'The only way you get the money back in the event of default is the security. Recourse is where you still have the opportunity to go back to the borrower for the rest of the money.',
			rangeIncludes: ['Boolean'],
		},
		{
			id: 'schema:renegotiableLoan',
			name: 'renegotiableLoan',
			label: 'renegotiableLoan',
			comment:
				'Whether the terms for payment of interest can be renegotiated during the life of the loan.',
			rangeIncludes: ['Boolean'],
		},
		{
			id: 'schema:requiredCollateral',
			name: 'requiredCollateral',
			label: 'requiredCollateral',
			comment:
				'Assets required to secure loan or credit repayments. It may take form of third party pledge, goods, financial instruments (cash, securities, etc.)',
			rangeIncludes: ['Text', 'Thing'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgLoanOrCredit;
export const LoanOrCredit = schemaOrgLoanOrCredit;

export default schemaOrgLoanOrCredit;
