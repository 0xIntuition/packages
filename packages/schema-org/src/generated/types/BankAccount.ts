import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgBankAccount = {
	id: 'schema:BankAccount',
	name: 'BankAccount',
	label: 'BankAccount',
	comment:
		'A product or service offered by a bank whereby one may deposit, withdraw or transfer money and in some cases be paid interest.',
	subClassOf: ['FinancialProduct', 'Service', 'Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:accountMinimumInflow',
			name: 'accountMinimumInflow',
			label: 'accountMinimumInflow',
			comment: 'A minimum amount that has to be paid in every month.',
			rangeIncludes: ['MonetaryAmount'],
		},
		{
			id: 'schema:accountOverdraftLimit',
			name: 'accountOverdraftLimit',
			label: 'accountOverdraftLimit',
			comment:
				'An overdraft is an extension of credit from a lending institution when an account reaches zero. An overdraft allows the individual to continue withdrawing money even if the account has no funds in it. Basically the bank allows people to borrow a set amount of money.',
			rangeIncludes: ['MonetaryAmount'],
		},
		{
			id: 'schema:bankAccountType',
			name: 'bankAccountType',
			label: 'bankAccountType',
			comment: 'The type of a bank account.',
			rangeIncludes: ['Text', 'URL'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgBankAccount;
export const BankAccount = schemaOrgBankAccount;

export default schemaOrgBankAccount;
