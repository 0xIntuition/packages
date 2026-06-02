import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgAutoBodyShop = {
	id: 'schema:AutoBodyShop',
	name: 'AutoBodyShop',
	label: 'AutoBodyShop',
	comment: 'Auto body shop.',
	subClassOf: ['AutomotiveBusiness', 'LocalBusiness', 'Organization', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgAutoBodyShop;
export const AutoBodyShop = schemaOrgAutoBodyShop;

export default schemaOrgAutoBodyShop;
