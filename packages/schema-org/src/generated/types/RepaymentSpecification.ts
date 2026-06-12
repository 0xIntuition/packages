import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgRepaymentSpecification = {
	id: 'schema:RepaymentSpecification',
	name: 'RepaymentSpecification',
	label: 'RepaymentSpecification',
	comment: 'A structured value representing repayment.',
	subClassOf: ['StructuredValue', 'Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:downPayment',
			name: 'downPayment',
			label: 'downPayment',
			comment:
				'a type of payment made in cash during the onset of the purchase of an expensive good/service. The payment typically represents only a percentage of the full purchase price.',
			rangeIncludes: ['MonetaryAmount', 'Number'],
		},
		{
			id: 'schema:earlyPrepaymentPenalty',
			name: 'earlyPrepaymentPenalty',
			label: 'earlyPrepaymentPenalty',
			comment: 'The amount to be paid as a penalty in the event of early payment of the loan.',
			rangeIncludes: ['MonetaryAmount'],
		},
		{
			id: 'schema:loanPaymentAmount',
			name: 'loanPaymentAmount',
			label: 'loanPaymentAmount',
			comment: 'The amount of money to pay in a single payment.',
			rangeIncludes: ['MonetaryAmount'],
		},
		{
			id: 'schema:loanPaymentFrequency',
			name: 'loanPaymentFrequency',
			label: 'loanPaymentFrequency',
			comment:
				'Frequency of payments due, i.e. number of months between payments. This is defined as a frequency, i.e. the reciprocal of a period of time.',
			rangeIncludes: ['Number'],
		},
		{
			id: 'schema:numberOfLoanPayments',
			name: 'numberOfLoanPayments',
			label: 'numberOfLoanPayments',
			comment:
				'The number of payments contractually required at origination to repay the loan. For monthly paying loans this is the number of months from the contractual first payment date to the maturity date.',
			rangeIncludes: ['Number'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgRepaymentSpecification;
export const RepaymentSpecification = schemaOrgRepaymentSpecification;

export default schemaOrgRepaymentSpecification;
