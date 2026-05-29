import type { ClassificationSpec } from '../../types.js';

export const product: ClassificationSpec = {
	slug: 'product',
	type: 'Product',
	displayName: 'Product',
	description: 'A product identity with optional brand and SKU disambiguators.',
	category: 'Product',
	schemaOrg: { context: 'https://schema.org/', type: 'Product' },
	fields: [
		{
			key: 'name',
			label: 'Product Name',
			description: 'The product name.',
			fieldType: 'string',
			required: true,
			placeholder: 'Ledger Nano X',
		},
		{
			key: 'brand',
			label: 'Brand',
			description: 'The brand name when needed.',
			fieldType: 'string',
			required: false,
			placeholder: 'Ledger',
		},
		{
			key: 'sku',
			label: 'SKU',
			description: 'The SKU when needed.',
			fieldType: 'string',
			required: false,
			placeholder: 'NANO-X',
		},
		{
			key: 'gtin',
			label: 'GTIN',
			description: 'The GTIN when available.',
			fieldType: 'string',
			required: false,
			placeholder: '1234567890123',
		},
		{
			key: 'sameAs',
			label: 'Canonical References',
			description: 'Canonical URLs for the same product.',
			fieldType: 'string[]',
			required: false,
			placeholder: 'https://example.com/products/ledger-nano-x',
		},
	],
	defaults: { pluginId: 'product' },
};
