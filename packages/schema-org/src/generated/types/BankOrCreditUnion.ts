import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgBankOrCreditUnion = {
	id: 'schema:BankOrCreditUnion',
	name: 'BankOrCreditUnion',
	label: 'BankOrCreditUnion',
	comment: 'Bank or credit union.',
	subClassOf: ['FinancialService', 'LocalBusiness', 'Organization', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgBankOrCreditUnion;
export const BankOrCreditUnion = schemaOrgBankOrCreditUnion;

export default schemaOrgBankOrCreditUnion;
