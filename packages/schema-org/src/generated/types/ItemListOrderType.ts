import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgItemListOrderType = {
	id: 'schema:ItemListOrderType',
	name: 'ItemListOrderType',
	label: 'ItemListOrderType',
	comment:
		'Enumerated for values for itemListOrder for indicating how an ordered ItemList is organized.',
	subClassOf: ['Enumeration', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgItemListOrderType;
export const ItemListOrderType = schemaOrgItemListOrderType;

export default schemaOrgItemListOrderType;
