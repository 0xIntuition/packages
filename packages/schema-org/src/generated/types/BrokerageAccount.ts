import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgBrokerageAccount = {
	id: 'schema:BrokerageAccount',
	name: 'BrokerageAccount',
	label: 'BrokerageAccount',
	comment:
		'An account that allows an investor to deposit funds and place investment orders with a licensed broker or brokerage firm.',
	subClassOf: ['InvestmentOrDeposit', 'FinancialProduct', 'Service', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgBrokerageAccount;
export const BrokerageAccount = schemaOrgBrokerageAccount;

export default schemaOrgBrokerageAccount;
