import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgInvestmentOrDeposit = {
	id: 'schema:InvestmentOrDeposit',
	name: 'InvestmentOrDeposit',
	label: 'InvestmentOrDeposit',
	comment:
		'A type of financial product that typically requires the client to transfer funds to a financial service in return for potential beneficial financial return.',
	subClassOf: ['FinancialProduct', 'Service', 'Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:amount',
			name: 'amount',
			label: 'amount',
			comment: 'The amount of money.',
			rangeIncludes: ['MonetaryAmount', 'Number'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgInvestmentOrDeposit;
export const InvestmentOrDeposit = schemaOrgInvestmentOrDeposit;

export default schemaOrgInvestmentOrDeposit;
