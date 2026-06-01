import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgShoppingCenter = {
	id: 'schema:ShoppingCenter',
	name: 'ShoppingCenter',
	label: 'ShoppingCenter',
	comment: 'A shopping center or mall.',
	subClassOf: ['LocalBusiness', 'Organization', 'Thing', 'Place'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgShoppingCenter;
export const ShoppingCenter = schemaOrgShoppingCenter;

export default schemaOrgShoppingCenter;
