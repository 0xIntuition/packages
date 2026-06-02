import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgInsuranceAgency = {
	id: 'schema:InsuranceAgency',
	name: 'InsuranceAgency',
	label: 'InsuranceAgency',
	comment: 'An Insurance agency.',
	subClassOf: ['FinancialService', 'LocalBusiness', 'Organization', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgInsuranceAgency;
export const InsuranceAgency = schemaOrgInsuranceAgency;

export default schemaOrgInsuranceAgency;
