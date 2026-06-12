import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMoneyTransfer = {
	id: 'schema:MoneyTransfer',
	name: 'MoneyTransfer',
	label: 'MoneyTransfer',
	comment:
		'The act of transferring money from one place to another place. This may occur electronically or physically.',
	subClassOf: ['TransferAction', 'Action', 'Thing'],
	properties: [
		{
			id: 'schema:amount',
			name: 'amount',
			label: 'amount',
			comment: 'The amount of money.',
			rangeIncludes: ['MonetaryAmount', 'Number'],
		},
		{
			id: 'schema:beneficiaryBank',
			name: 'beneficiaryBank',
			label: 'beneficiaryBank',
			comment:
				'A bank or bank’s branch, financial institution or international financial institution operating the beneficiary’s bank account or releasing funds for the beneficiary.',
			rangeIncludes: ['BankOrCreditUnion', 'Text'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgMoneyTransfer;
export const MoneyTransfer = schemaOrgMoneyTransfer;

export default schemaOrgMoneyTransfer;
