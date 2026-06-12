import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgDrinkAction = {
	id: 'schema:DrinkAction',
	name: 'DrinkAction',
	label: 'DrinkAction',
	comment: 'The act of swallowing liquids.',
	subClassOf: ['ConsumeAction', 'Action', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgDrinkAction;
export const DrinkAction = schemaOrgDrinkAction;

export default schemaOrgDrinkAction;
