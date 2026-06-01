import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgRestaurant = {
	id: 'schema:Restaurant',
	name: 'Restaurant',
	label: 'Restaurant',
	comment: 'A restaurant.',
	subClassOf: ['FoodEstablishment', 'LocalBusiness', 'Organization', 'Thing', 'Place'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgRestaurant;
export const Restaurant = schemaOrgRestaurant;

export default schemaOrgRestaurant;
