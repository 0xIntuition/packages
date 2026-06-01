import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgSportingGoodsStore = {
	id: 'schema:SportingGoodsStore',
	name: 'SportingGoodsStore',
	label: 'SportingGoodsStore',
	comment: 'A sporting goods store.',
	subClassOf: ['Store', 'LocalBusiness', 'Organization', 'Thing', 'Place'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgSportingGoodsStore;
export const SportingGoodsStore = schemaOrgSportingGoodsStore;

export default schemaOrgSportingGoodsStore;
