import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgIceCreamShop = {
	id: 'schema:IceCreamShop',
	name: 'IceCreamShop',
	label: 'IceCreamShop',
	comment: 'An ice cream shop.',
	subClassOf: ['FoodEstablishment', 'LocalBusiness', 'Organization', 'Thing', 'Place'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgIceCreamShop;
export const IceCreamShop = schemaOrgIceCreamShop;

export default schemaOrgIceCreamShop;
