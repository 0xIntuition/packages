import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMenu = {
	id: 'schema:Menu',
	name: 'Menu',
	label: 'Menu',
	comment: 'A structured representation of food or drink items available from a FoodEstablishment.',
	subClassOf: ['CreativeWork', 'Thing'],
	properties: [
		{
			id: 'schema:hasMenuItem',
			name: 'hasMenuItem',
			label: 'hasMenuItem',
			comment: 'A food or drink item contained in a menu or menu section.',
			rangeIncludes: ['MenuItem'],
		},
		{
			id: 'schema:hasMenuSection',
			name: 'hasMenuSection',
			label: 'hasMenuSection',
			comment: 'A subgrouping of the menu (by dishes, course, serving time period, etc.).',
			rangeIncludes: ['MenuSection'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgMenu;
export const Menu = schemaOrgMenu;

export default schemaOrgMenu;
