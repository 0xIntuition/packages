import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgAutoRepair = {
	id: 'schema:AutoRepair',
	name: 'AutoRepair',
	label: 'AutoRepair',
	comment: 'Car repair business.',
	subClassOf: ['AutomotiveBusiness', 'LocalBusiness', 'Organization', 'Thing', 'Place'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgAutoRepair;
export const AutoRepair = schemaOrgAutoRepair;

export default schemaOrgAutoRepair;
