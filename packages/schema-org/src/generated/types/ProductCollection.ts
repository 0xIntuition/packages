import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgProductCollection = {
	id: 'schema:ProductCollection',
	name: 'ProductCollection',
	label: 'ProductCollection',
	comment:
		'A set of products (either [[ProductGroup]]s or specific variants) that are listed together e.g. in an [[Offer]].',
	subClassOf: ['Collection', 'CreativeWork', 'Thing', 'Product'],
	properties: [
		{
			id: 'schema:includesObject',
			name: 'includesObject',
			label: 'includesObject',
			comment:
				'This links to a node or nodes indicating the exact quantity of the products included in  an [[Offer]] or [[ProductCollection]].',
			rangeIncludes: ['TypeAndQuantityNode'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgProductCollection;
export const ProductCollection = schemaOrgProductCollection;

export default schemaOrgProductCollection;
