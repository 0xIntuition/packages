import type { ClassificationSpec } from '../../types.js';

export const product: ClassificationSpec = {
	slug: 'product',
	type: 'Product',
	displayName: 'Product',
	description: 'A product identity with optional brand and SKU disambiguators.',
	category: 'Product',
	schema: { context: 'https://schema.org/', type: 'Product' },
	metadataPredicates: ['brand', 'manufacturer', 'hasCategory', 'sameAs'] as const,
	fields: [
		{
			key: 'name',
			schemaProperty: 'name',
			label: 'Product Name',
			description: 'The product name.',
			fieldType: 'string',
			required: true,
			placeholder: 'Ledger Nano X',
		},
		{
			key: 'brand',
			schemaProperty: 'brand',
			label: 'Brand',
			description: 'The brand name when needed.',
			fieldType: 'string',
			required: false,
			placeholder: 'Ledger',
		},
		{
			key: 'sku',
			schemaProperty: 'sku',
			label: 'SKU',
			description: 'The SKU when needed.',
			fieldType: 'string',
			required: false,
			placeholder: 'NANO-X',
		},
		{
			key: 'gtin',
			schemaProperty: 'gtin',
			label: 'GTIN',
			description: 'The GTIN when available.',
			fieldType: 'string',
			required: false,
			placeholder: '1234567890123',
		},
		{
			key: 'sameAs',
			schemaProperty: 'sameAs',
			label: 'Canonical References',
			description: 'Canonical URLs for the same product.',
			fieldType: 'string[]',
			required: false,
			placeholder: 'https://example.com/products/ledger-nano-x',
		},
	],
	defaults: { pluginId: 'product' },
	identity: {
		identifies: 'the product model (not individual units)',
		ladder: [
			{ kind: 'scheme', scheme: 'gtin', source: { kind: 'field', key: 'gtin' } },
			// D21: brand and SKU omitted — brand linkage is a triple
			{ kind: 'gen1', tag: 2, recipe: [{ key: 'name', from: 'field' }] },
		],
	},
};
