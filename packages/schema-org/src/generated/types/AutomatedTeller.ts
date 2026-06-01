import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgAutomatedTeller = {
	id: 'schema:AutomatedTeller',
	name: 'AutomatedTeller',
	label: 'AutomatedTeller',
	comment: 'ATM/cash machine.',
	subClassOf: ['FinancialService', 'LocalBusiness', 'Organization', 'Thing', 'Place'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgAutomatedTeller;
export const AutomatedTeller = schemaOrgAutomatedTeller;

export default schemaOrgAutomatedTeller;
