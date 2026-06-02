import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgDepositAccount = {
	id: 'schema:DepositAccount',
	name: 'DepositAccount',
	label: 'DepositAccount',
	comment:
		'A type of Bank Account with a main purpose of depositing funds to gain interest or other benefits.',
	subClassOf: [
		'BankAccount',
		'InvestmentOrDeposit',
		'FinancialProduct',
		'Service',
		'Intangible',
		'Thing',
	],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgDepositAccount;
export const DepositAccount = schemaOrgDepositAccount;

export default schemaOrgDepositAccount;
