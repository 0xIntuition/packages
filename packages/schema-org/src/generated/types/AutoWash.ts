import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgAutoWash = {
	id: 'schema:AutoWash',
	name: 'AutoWash',
	label: 'AutoWash',
	comment: 'A car wash business.',
	subClassOf: ['AutomotiveBusiness', 'LocalBusiness', 'Organization', 'Thing', 'Place'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgAutoWash;
export const AutoWash = schemaOrgAutoWash;

export default schemaOrgAutoWash;
