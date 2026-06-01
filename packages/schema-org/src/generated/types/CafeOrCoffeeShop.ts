import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgCafeOrCoffeeShop = {
	id: 'schema:CafeOrCoffeeShop',
	name: 'CafeOrCoffeeShop',
	label: 'CafeOrCoffeeShop',
	comment: 'A cafe or coffee shop.',
	subClassOf: ['FoodEstablishment', 'LocalBusiness', 'Organization', 'Thing', 'Place'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgCafeOrCoffeeShop;
export const CafeOrCoffeeShop = schemaOrgCafeOrCoffeeShop;

export default schemaOrgCafeOrCoffeeShop;
