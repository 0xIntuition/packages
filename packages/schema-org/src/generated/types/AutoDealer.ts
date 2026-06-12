import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgAutoDealer = {
	id: 'schema:AutoDealer',
	name: 'AutoDealer',
	label: 'AutoDealer',
	comment: 'An car dealership.',
	subClassOf: ['AutomotiveBusiness', 'LocalBusiness', 'Organization', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgAutoDealer;
export const AutoDealer = schemaOrgAutoDealer;

export default schemaOrgAutoDealer;
