import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgSomeProducts = {
	id: 'schema:SomeProducts',
	name: 'SomeProducts',
	label: 'SomeProducts',
	comment: 'A placeholder for multiple similar products of the same kind.',
	subClassOf: ['Product', 'Thing'],
	properties: [
		{
			id: 'schema:inventoryLevel',
			name: 'inventoryLevel',
			label: 'inventoryLevel',
			comment: 'The current approximate inventory level for the item or items.',
			rangeIncludes: ['QuantitativeValue'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgSomeProducts;
export const SomeProducts = schemaOrgSomeProducts;

export default schemaOrgSomeProducts;
