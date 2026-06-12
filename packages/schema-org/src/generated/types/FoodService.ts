import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgFoodService = {
	id: 'schema:FoodService',
	name: 'FoodService',
	label: 'FoodService',
	comment: 'A food service, like breakfast, lunch, or dinner.',
	subClassOf: ['Service', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgFoodService;
export const FoodService = schemaOrgFoodService;

export default schemaOrgFoodService;
