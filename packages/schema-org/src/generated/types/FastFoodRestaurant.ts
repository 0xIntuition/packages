import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgFastFoodRestaurant = {
	id: 'schema:FastFoodRestaurant',
	name: 'FastFoodRestaurant',
	label: 'FastFoodRestaurant',
	comment: 'A fast-food restaurant.',
	subClassOf: ['FoodEstablishment', 'LocalBusiness', 'Organization', 'Thing', 'Place'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgFastFoodRestaurant;
export const FastFoodRestaurant = schemaOrgFastFoodRestaurant;

export default schemaOrgFastFoodRestaurant;
