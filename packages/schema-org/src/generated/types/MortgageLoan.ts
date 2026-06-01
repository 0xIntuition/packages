import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMortgageLoan = {
	id: 'schema:MortgageLoan',
	name: 'MortgageLoan',
	label: 'MortgageLoan',
	comment:
		'A loan in which property or real estate is used as collateral. (A loan securitized against some real estate.)',
	subClassOf: ['LoanOrCredit', 'FinancialProduct', 'Service', 'Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:domiciledMortgage',
			name: 'domiciledMortgage',
			label: 'domiciledMortgage',
			comment: 'Whether borrower is a resident of the jurisdiction where the property is located.',
			rangeIncludes: ['Boolean'],
		},
		{
			id: 'schema:loanMortgageMandateAmount',
			name: 'loanMortgageMandateAmount',
			label: 'loanMortgageMandateAmount',
			comment:
				'Amount of mortgage mandate that can be converted into a proper mortgage at a later stage.',
			rangeIncludes: ['MonetaryAmount'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgMortgageLoan;
export const MortgageLoan = schemaOrgMortgageLoan;

export default schemaOrgMortgageLoan;
