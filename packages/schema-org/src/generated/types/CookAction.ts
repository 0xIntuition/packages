import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgCookAction = {
	id: 'schema:CookAction',
	name: 'CookAction',
	label: 'CookAction',
	comment: 'The act of producing/preparing food.',
	subClassOf: ['CreateAction', 'Action', 'Thing'],
	properties: [
		{
			id: 'schema:foodEstablishment',
			name: 'foodEstablishment',
			label: 'foodEstablishment',
			comment:
				'A sub property of location. The specific food establishment where the action occurred.',
			rangeIncludes: ['FoodEstablishment', 'Place'],
		},
		{
			id: 'schema:foodEvent',
			name: 'foodEvent',
			label: 'foodEvent',
			comment: 'A sub property of location. The specific food event where the action occurred.',
			rangeIncludes: ['FoodEvent'],
		},
		{
			id: 'schema:recipe',
			name: 'recipe',
			label: 'recipe',
			comment: 'A sub property of instrument. The recipe/instructions used to perform the action.',
			rangeIncludes: ['Recipe'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgCookAction;
export const CookAction = schemaOrgCookAction;

export default schemaOrgCookAction;
