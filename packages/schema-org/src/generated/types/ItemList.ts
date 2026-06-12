import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgItemList = {
	id: 'schema:ItemList',
	name: 'ItemList',
	label: 'ItemList',
	comment:
		'A list of items of any sort&#x2014;for example, Top 10 Movies About Weathermen, or Top 100 Party Songs. Not to be confused with HTML lists, which are often used only for formatting.',
	subClassOf: ['Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:aggregateElement',
			name: 'aggregateElement',
			label: 'aggregateElement',
			comment:
				'Indicates a prototype of the elements in the list that is used to hold aggregate information (ratings, offers, etc.).',
			rangeIncludes: ['Thing'],
		},
		{
			id: 'schema:itemListElement',
			name: 'itemListElement',
			label: 'itemListElement',
			comment:
				'For itemListElement values, you can use simple strings (e.g. "Peter", "Paul", "Mary"), existing entities, or use ListItem.\\n\\nText values are best if the elements in the list are plain strings. Existing entities are best for a simple, unordered list of existing things in your data. ListItem is used with ordered lists when you want to provide additional context about the element in that list or when the same item might be in different places in different lists.\\n\\nNote: The order of elements in your mark-up is not sufficient for indicating the order or elements.  Use ListItem with a \'position\' property in such cases.',
			rangeIncludes: ['ListItem', 'Text', 'Thing'],
		},
		{
			id: 'schema:itemListOrder',
			name: 'itemListOrder',
			label: 'itemListOrder',
			comment: 'Type of ordering (e.g. Ascending, Descending, Unordered).',
			rangeIncludes: ['ItemListOrderType', 'Text'],
		},
		{
			id: 'schema:numberOfItems',
			name: 'numberOfItems',
			label: 'numberOfItems',
			comment:
				'The number of items in an ItemList. Note that some descriptions might not fully describe all items in a list (e.g., multi-page pagination); in such cases, the numberOfItems would be for the entire list.',
			rangeIncludes: ['Integer'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgItemList;
export const ItemList = schemaOrgItemList;

export default schemaOrgItemList;
