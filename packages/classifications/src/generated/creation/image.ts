import type { CreationProfile } from '../../creation-profile.js';

export const imageCreationProfile = {
	classification: {
		slug: 'image',
		type: 'ImageObject',
		displayName: 'Image',
		description: 'An image identity with a canonical source URL.',
		category: 'Media',
		schema: {
			context: 'https://schema.org/',
			type: 'ImageObject',
		},
	},
	fields: [
		{
			key: 'name',
			label: 'Image Name',
			description: 'The image name or title.',
			fieldType: 'string',
			required: true,
			placeholder: 'knowledge-graph',
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
			key: 'url',
			label: 'Image URL',
			description: 'The canonical image URL.',
			fieldType: 'url',
			required: true,
			placeholder: 'https://example.com/image.png',
			schemaProperty: 'url',
			schema: {
				context: 'https://schema.org/',
				property: 'url',
				propertyId: 'schema:url',
				label: 'url',
				comment: 'URL of the item.',
				originType: 'Thing',
				originTypeId: 'schema:Thing',
				rangeIncludes: ['URL'],
			},
		},
		{
			key: 'caption',
			label: 'Caption',
			description: 'A caption or short text describing the image.',
			fieldType: 'string',
			required: false,
			placeholder: 'The world is filled with knowledge.',
			schemaProperty: 'caption',
			schema: {
				context: 'https://schema.org/',
				property: 'caption',
				propertyId: 'schema:caption',
				label: 'caption',
				comment:
					'The caption for this object. For downloadable machine formats (closed caption, subtitles etc.) use MediaObject and indicate the [[encodingFormat]].',
				originType: 'ImageObject',
				originTypeId: 'schema:ImageObject',
				rangeIncludes: ['MediaObject', 'Text'],
			},
		},
		{
			key: 'keywords',
			label: 'Keywords',
			description: 'Keywords that describe the image.',
			fieldType: 'string[]',
			required: false,
			placeholder: 'knowledge-graph',
			schemaProperty: 'keywords',
			schema: {
				context: 'https://schema.org/',
				property: 'keywords',
				propertyId: 'schema:keywords',
				label: 'keywords',
				comment:
					'Keywords or tags used to describe some item. Multiple textual entries in a keywords list are typically delimited by commas, or by repeating the property.',
				originType: 'CreativeWork',
				originTypeId: 'schema:CreativeWork',
				rangeIncludes: ['DefinedTerm', 'Text', 'URL'],
			},
		},
		{
			key: 'contentHash',
			label: 'Content Hash',
			description: 'Hash of the image bytes as alg:hex, e.g. sha256:<hex>.',
			fieldType: 'string',
			required: false,
			placeholder: 'sha256:9f86d081884c7d65…',
			schema: null,
		},
		{
			key: 'sameAs',
			label: 'Canonical References',
			description: 'Canonical URLs that identify the same image.',
			fieldType: 'string[]',
			required: false,
			placeholder: 'https://example.com/...',
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
			subjectClassification: 'image',
			predicate: {
				key: 'authoredBy',
				id: '0x19e5da5af4adf03fb4d69e6910be4f17f9c612d98f150d2e9e0f3569cea304a9',
				label: 'authored by',
				description: 'The subject content was written or composed by the object actor',
				status: 'proposed',
				category: 'Authorship/Contribution',
				marketPattern: 'attributive',
			},
			expectedObjects: [
				{
					kind: 'classification',
					slug: 'person',
				},
			],
		},
		{
			subjectClassification: 'image',
			predicate: {
				key: 'createdBy',
				id: '0x3df2eaf3b9bdaf2018bc5d45fa770c470ab5067b5afdc9e3097151f9c87d92a4',
				label: 'created by',
				description:
					'The subject was originally created or brought into existence by the object actor',
				status: 'enshrined',
				category: 'Authorship/Contribution',
				marketPattern: 'attributive',
			},
			expectedObjects: [
				{
					kind: 'classification',
					slug: 'person',
				},
				{
					kind: 'classification',
					slug: 'company',
				},
			],
		},
		{
			subjectClassification: 'image',
			predicate: {
				key: 'url',
				id: '0x71dbe59780ccedf37166aa55781573d8aea463285cdfe94a5b08ed5f474613a3',
				label: 'url',
				description: 'Links the subject atom to its canonical URL or web-addressable identifier',
				status: 'enshrined',
				category: 'Metadata/Linking',
				marketPattern: 'attributive',
			},
			expectedObjects: [
				{
					kind: 'primitive',
					valueType: 'url',
				},
			],
		},
		{
			subjectClassification: 'image',
			predicate: {
				key: 'imgUrl',
				id: '0x9f2f3089c1f61cae97bc0a50bb199854489df1971641336f9247395131eaba2f',
				label: 'imgUrl',
				description:
					'Links the subject atom to an image URL. Legacy camelCase naming retained for backward compatibility',
				status: 'enshrined',
				category: 'Metadata/Linking',
				marketPattern: 'attributive',
			},
			expectedObjects: [
				{
					kind: 'primitive',
					valueType: 'url',
				},
			],
		},
		{
			subjectClassification: 'image',
			predicate: {
				key: 'hasTag',
				id: '0x137f29ea8a0422c9d1003ece2e1883e916d4a106da0a897279842ffbb793229a',
				label: 'has tag',
				description:
					'Assigns a reusable tag or keyword atom to the subject for filtering, clustering, and discovery',
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
			subjectClassification: 'image',
			predicate: {
				key: 'hasCategory',
				id: '0xbf037cebba059cbb9547b784b0f667db03f08c177fc0f94c0f734cf16cdc0fa8',
				label: 'has category',
				description:
					'Places the subject within a broader categorical grouping. More formal than tags — use for structured taxonomies rather than free-form labeling',
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
			subjectClassification: 'image',
			predicate: {
				key: 'sameAs',
				id: '0x1908b7994ca437c84c67a4799ae710355591790a726bf5890277f3aa70828c0a',
				label: 'same as',
				description:
					'Declares that the subject and object refer to the same real-world entity across different representations or naming systems',
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
	availableFieldCount: 151,
} as const satisfies CreationProfile;

export const creationProfile = imageCreationProfile;
export default imageCreationProfile;
