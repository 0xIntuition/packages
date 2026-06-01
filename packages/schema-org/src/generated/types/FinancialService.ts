import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgFinancialService = {
	id: 'schema:FinancialService',
	name: 'FinancialService',
	label: 'FinancialService',
	comment: 'Financial services business.',
	subClassOf: ['LocalBusiness', 'Organization', 'Thing', 'Place'],
	properties: [
		{
			id: 'schema:feesAndCommissionsSpecification',
			name: 'feesAndCommissionsSpecification',
			label: 'feesAndCommissionsSpecification',
			comment:
				'Description of fees, commissions, and other terms applied either to a class of financial product, or by a financial service organization.',
			rangeIncludes: ['Text', 'URL'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgFinancialService;
export const FinancialService = schemaOrgFinancialService;

export default schemaOrgFinancialService;
