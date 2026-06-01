import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgIncentiveType = {
	id: 'schema:IncentiveType',
	name: 'IncentiveType',
	label: 'IncentiveType',
	comment:
		'Enumerates common financial incentives for products, including tax credits, tax deductions, rebates and subsidies, etc.',
	subClassOf: ['Enumeration', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgIncentiveType;
export const IncentiveType = schemaOrgIncentiveType;

export default schemaOrgIncentiveType;
