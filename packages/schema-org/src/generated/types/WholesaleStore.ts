import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgWholesaleStore = {
	id: 'schema:WholesaleStore',
	name: 'WholesaleStore',
	label: 'WholesaleStore',
	comment: 'A wholesale store.',
	subClassOf: ['Store', 'LocalBusiness', 'Organization', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgWholesaleStore;
export const WholesaleStore = schemaOrgWholesaleStore;

export default schemaOrgWholesaleStore;
