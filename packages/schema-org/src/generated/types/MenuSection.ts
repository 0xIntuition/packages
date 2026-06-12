import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMenuSection = {
	id: 'schema:MenuSection',
	name: 'MenuSection',
	label: 'MenuSection',
	comment:
		"A sub-grouping of food or drink items in a menu. E.g. courses (such as 'Dinner', 'Breakfast', etc.), specific type of dishes (such as 'Meat', 'Vegan', 'Drinks', etc.), or some other classification made by the menu provider.",
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

export const spec = schemaOrgMenuSection;
export const MenuSection = schemaOrgMenuSection;

export default schemaOrgMenuSection;
