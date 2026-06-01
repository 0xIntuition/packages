import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgFoodEvent = {
	id: 'schema:FoodEvent',
	name: 'FoodEvent',
	label: 'FoodEvent',
	comment: 'Event type: Food event.',
	subClassOf: ['Event', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgFoodEvent;
export const FoodEvent = schemaOrgFoodEvent;

export default schemaOrgFoodEvent;
