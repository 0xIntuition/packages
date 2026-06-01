import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgGroceryStore = {
	id: 'schema:GroceryStore',
	name: 'GroceryStore',
	label: 'GroceryStore',
	comment: 'A grocery store.',
	subClassOf: ['Store', 'LocalBusiness', 'Organization', 'Thing', 'Place'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgGroceryStore;
export const GroceryStore = schemaOrgGroceryStore;

export default schemaOrgGroceryStore;
