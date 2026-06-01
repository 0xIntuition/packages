import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgFinancialProduct = {
	id: 'schema:FinancialProduct',
	name: 'FinancialProduct',
	label: 'FinancialProduct',
	comment:
		'A product provided to consumers and businesses by financial institutions such as banks, insurance companies, brokerage firms, consumer finance companies, and investment companies which comprise the financial services industry.',
	subClassOf: ['Service', 'Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:annualPercentageRate',
			name: 'annualPercentageRate',
			label: 'annualPercentageRate',
			comment:
				'The annual rate that is charged for borrowing (or made by investing), expressed as a single percentage number that represents the actual yearly cost of funds over the term of a loan. This includes any fees or additional costs associated with the transaction.',
			rangeIncludes: ['Number', 'QuantitativeValue'],
		},
		{
			id: 'schema:feesAndCommissionsSpecification',
			name: 'feesAndCommissionsSpecification',
			label: 'feesAndCommissionsSpecification',
			comment:
				'Description of fees, commissions, and other terms applied either to a class of financial product, or by a financial service organization.',
			rangeIncludes: ['Text', 'URL'],
		},
		{
			id: 'schema:interestRate',
			name: 'interestRate',
			label: 'interestRate',
			comment:
				'The interest rate, charged or paid, applicable to the financial product. Note: This is different from the calculated annualPercentageRate.',
			rangeIncludes: ['Number', 'QuantitativeValue'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgFinancialProduct;
export const FinancialProduct = schemaOrgFinancialProduct;

export default schemaOrgFinancialProduct;
