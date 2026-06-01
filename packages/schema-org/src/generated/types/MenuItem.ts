import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMenuItem = {
	id: 'schema:MenuItem',
	name: 'MenuItem',
	label: 'MenuItem',
	comment: 'A food or drink item listed in a menu or menu section.',
	subClassOf: ['Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:menuAddOn',
			name: 'menuAddOn',
			label: 'menuAddOn',
			comment:
				'Additional menu item(s) such as a side dish of salad or side order of fries that can be added to this menu item. Additionally it can be a menu section containing allowed add-on menu items for this menu item.',
			rangeIncludes: ['MenuItem', 'MenuSection'],
		},
		{
			id: 'schema:nutrition',
			name: 'nutrition',
			label: 'nutrition',
			comment: 'Nutrition information about the recipe or menu item.',
			rangeIncludes: ['NutritionInformation'],
		},
		{
			id: 'schema:offers',
			name: 'offers',
			label: 'offers',
			comment:
				'An offer to provide this item&#x2014;for example, an offer to sell a product, rent the DVD of a movie, perform a service, or give away tickets to an event. Use [[businessFunction]] to indicate the kind of transaction offered, i.e. sell, lease, etc. This property can also be used to describe a [[Demand]]. While this property is listed as expected on a number of common types, it can be used in others. In that case, using a second type, such as Product or a subtype of Product, can clarify the nature of the offer.\n      ',
			rangeIncludes: ['Demand', 'Offer'],
		},
		{
			id: 'schema:suitableForDiet',
			name: 'suitableForDiet',
			label: 'suitableForDiet',
			comment:
				'Indicates a dietary restriction or guideline for which this recipe or menu item is suitable, e.g. diabetic, halal etc.',
			rangeIncludes: ['Diet', 'RestrictedDiet'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgMenuItem;
export const MenuItem = schemaOrgMenuItem;

export default schemaOrgMenuItem;
