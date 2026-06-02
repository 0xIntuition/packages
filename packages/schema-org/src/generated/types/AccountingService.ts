import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgAccountingService = {
	id: 'schema:AccountingService',
	name: 'AccountingService',
	label: 'AccountingService',
	comment:
		'Accountancy business.\\n\\nAs a [[LocalBusiness]] it can be described as a [[provider]] of one or more [[Service]]\\(s).\n      ',
	subClassOf: ['FinancialService', 'LocalBusiness', 'Organization', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgAccountingService;
export const AccountingService = schemaOrgAccountingService;

export default schemaOrgAccountingService;
