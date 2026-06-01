import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgIncentiveQualifiedExpenseType = {
	id: 'schema:IncentiveQualifiedExpenseType',
	name: 'IncentiveQualifiedExpenseType',
	label: 'IncentiveQualifiedExpenseType',
	comment:
		'The types of expenses that are covered by the incentive. For example some incentives are only for the goods (tangible items) but the services (labor) are excluded.',
	subClassOf: ['Enumeration', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgIncentiveQualifiedExpenseType;
export const IncentiveQualifiedExpenseType = schemaOrgIncentiveQualifiedExpenseType;

export default schemaOrgIncentiveQualifiedExpenseType;
