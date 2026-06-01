import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgInvestmentFund = {
	id: 'schema:InvestmentFund',
	name: 'InvestmentFund',
	label: 'InvestmentFund',
	comment:
		'A company or fund that gathers capital from a number of investors to create a pool of money that is then re-invested into stocks, bonds and other assets.',
	subClassOf: ['InvestmentOrDeposit', 'FinancialProduct', 'Service', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgInvestmentFund;
export const InvestmentFund = schemaOrgInvestmentFund;

export default schemaOrgInvestmentFund;
