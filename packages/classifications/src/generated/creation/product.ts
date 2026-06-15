import type { CreationProfile } from '../../creation-profile.js';

export const productCreationProfile = {
	classification: {
		slug: 'product',
		type: 'Product',
		displayName: 'Product',
		description: 'A product identity with optional brand and SKU disambiguators.',
		category: 'Product',
		schema: {
			context: 'https://schema.org/',
			type: 'Product',
		},
	},
	fields: [
		{
			key: 'name',
			label: 'Product Name',
			description: 'The product name.',
			fieldType: 'string',
			required: true,
			placeholder: 'Ledger Nano X',
			schemaProperty: 'name',
			schema: {
				context: 'https://schema.org/',
				property: 'name',
				propertyId: 'schema:name',
				label: 'name',
				comment: 'The name of the item.',
				originType: 'Thing',
				originTypeId: 'schema:Thing',
				rangeIncludes: ['Text'],
			},
		},
		{
			key: 'brand',
			label: 'Brand',
			description: 'The brand name when needed.',
			fieldType: 'string',
			required: false,
			placeholder: 'Ledger',
			schemaProperty: 'brand',
			schema: {
				context: 'https://schema.org/',
				property: 'brand',
				propertyId: 'schema:brand',
				label: 'brand',
				comment:
					'The brand(s) associated with a product or service, or the brand(s) maintained by an organization or business person.',
				originType: 'Product',
				originTypeId: 'schema:Product',
				rangeIncludes: ['Brand', 'Organization'],
			},
		},
		{
			key: 'sku',
			label: 'SKU',
			description: 'The SKU when needed.',
			fieldType: 'string',
			required: false,
			placeholder: 'NANO-X',
			schemaProperty: 'sku',
			schema: {
				context: 'https://schema.org/',
				property: 'sku',
				propertyId: 'schema:sku',
				label: 'sku',
				comment:
					'The Stock Keeping Unit (SKU), i.e. a merchant-specific identifier for a product or service, or the product to which the offer refers.',
				originType: 'Product',
				originTypeId: 'schema:Product',
				rangeIncludes: ['Text'],
			},
		},
		{
			key: 'gtin',
			label: 'GTIN',
			description: 'The GTIN when available.',
			fieldType: 'string',
			required: false,
			placeholder: '1234567890123',
			schemaProperty: 'gtin',
			schema: {
				context: 'https://schema.org/',
				property: 'gtin',
				propertyId: 'schema:gtin',
				label: 'gtin',
				comment:
					'A Global Trade Item Number ([GTIN](https://www.gs1.org/standards/id-keys/gtin)). GTINs identify trade items, including products and services, using numeric identification codes.\n\nA correct [[gtin]] value should be a valid GTIN, which means that it should be an all-numeric string of either 8, 12, 13 or 14 digits, or a "GS1 Digital Link" URL based on such a string. The numeric component should also have a [valid GS1 check digit](https://www.gs1.org/services/check-digit-calculator) and meet the other rules for valid GTINs. See also [GS1\'s GTIN Summary](http://www.gs1.org/barcodes/technical/idkeys/gtin) and [Wikipedia](https://en.wikipedia.org/wiki/Global_Trade_Item_Number) for more details. Left-padding of the gtin values is not required or encouraged. The [[gtin]] property generalizes the earlier [[gtin8]], [[gtin12]], [[gtin13]], and [[gtin14]] properties.\n\nThe GS1 [digital link specifications](https://www.gs1.org/standards/Digital-Link/) expresses GTINs as URLs (URIs, IRIs, etc.).\nDigital Links should be populated into the [[hasGS1DigitalLink]] attribute.\n\nNote also that this is a definition for how to include GTINs in Schema.org data, and not a definition of GTINs in general - see the GS1 documentation for authoritative details.',
				originType: 'Product',
				originTypeId: 'schema:Product',
				rangeIncludes: ['Text', 'URL'],
			},
		},
		{
			key: 'sameAs',
			label: 'Canonical References',
			description: 'Canonical URLs for the same product.',
			fieldType: 'string[]',
			required: false,
			placeholder: 'https://example.com/products/ledger-nano-x',
			schemaProperty: 'sameAs',
			schema: {
				context: 'https://schema.org/',
				property: 'sameAs',
				propertyId: 'schema:sameAs',
				label: 'sameAs',
				comment:
					"URL of a reference Web page that unambiguously indicates the item's identity. E.g. the URL of the item's Wikipedia page, Wikidata entry, or official website.",
				originType: 'Thing',
				originTypeId: 'schema:Thing',
				rangeIncludes: ['URL'],
			},
		},
	],
	relationships: [
		{
			subjectClassification: 'product',
			predicate: {
				key: 'brand',
				id: '0xb4bff7194354fe3119bbf4c207a8128bd174242d728668f14e6d80fb05bff74d',
				label: 'brand',
				description:
					'The subject product, service, or organization is associated with the object brand',
				status: 'proposed',
				category: 'Identity/Classification',
				marketPattern: 'attributive',
			},
			expectedObjects: [
				{
					kind: 'classification',
					slug: 'brand',
				},
			],
		},
		{
			subjectClassification: 'product',
			predicate: {
				key: 'manufacturer',
				id: '0x33138cc38f644287fbf03a4d06dc4c83ff7b64d7679f9239d3c7a35cc73e4f2a',
				label: 'manufacturer',
				description: 'The subject product was manufactured by the object organization',
				status: 'proposed',
				category: 'Authorship/Contribution',
				marketPattern: 'attributive',
			},
			expectedObjects: [
				{
					kind: 'classification',
					slug: 'company',
				},
			],
		},
		{
			subjectClassification: 'product',
			predicate: {
				key: 'hasCategory',
				id: '0x7540882b556f76cd67ce24a0ecdb16a175dc438ed63a003180cb62794568748a',
				label: 'has category',
				description:
					'Places the subject in a product-level browsable category for user-facing discovery and filtering. Less formal than `has type` (which asserts a taxonomy classification) and more curated than `has tag` (which is free-form)',
				status: 'enshrined',
				category: 'Identity/Classification',
				marketPattern: 'attributive',
			},
			expectedObjects: [
				{
					kind: 'classification',
					slug: 'defined-term',
				},
			],
		},
		{
			subjectClassification: 'product',
			predicate: {
				key: 'sameAs',
				id: '0x13fa59de1639343483dd3c864cf585b571fe43b67e0ce9c2335a803c4e8f7348',
				label: 'same as',
				description:
					'Declares that the subject and object refer to the same real-world entity across representations, naming systems, or aliases. Symmetric and transitive — use for identity resolution, duplicate collapsing, and alternate-name mapping',
				status: 'enshrined',
				category: 'Identity/Classification',
				marketPattern: 'attributive',
			},
			expectedObjects: [
				{
					kind: 'same-classification',
				},
			],
			schemaMappings: [
				{
					context: 'https://schema.org/',
					property: 'sameAs',
					match: 'exact',
				},
			],
			priority: 'recommended',
			notes: 'Use for strict identity links only between atoms with the same classification.',
		},
	],
	availableFieldCount: 72,
} as const satisfies CreationProfile;

export const creationProfile = productCreationProfile;
export default productCreationProfile;
