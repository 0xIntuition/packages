import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgLiquorStore = {
	id: 'schema:LiquorStore',
	name: 'LiquorStore',
	label: 'LiquorStore',
	comment: 'A shop that sells alcoholic drinks such as wine, beer, whisky and other spirits.',
	subClassOf: ['Store', 'LocalBusiness', 'Organization', 'Thing', 'Place'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgLiquorStore;
export const LiquorStore = schemaOrgLiquorStore;

export default schemaOrgLiquorStore;
