import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgHomeGoodsStore = {
	id: 'schema:HomeGoodsStore',
	name: 'HomeGoodsStore',
	label: 'HomeGoodsStore',
	comment: 'A home goods store.',
	subClassOf: ['Store', 'LocalBusiness', 'Organization', 'Thing', 'Place'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgHomeGoodsStore;
export const HomeGoodsStore = schemaOrgHomeGoodsStore;

export default schemaOrgHomeGoodsStore;
