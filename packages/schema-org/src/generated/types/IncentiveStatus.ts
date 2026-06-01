import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgIncentiveStatus = {
	id: 'schema:IncentiveStatus',
	name: 'IncentiveStatus',
	label: 'IncentiveStatus',
	comment: 'Enumerates a status for an incentive, such as whether it is active.',
	subClassOf: ['Enumeration', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgIncentiveStatus;
export const IncentiveStatus = schemaOrgIncentiveStatus;

export default schemaOrgIncentiveStatus;
