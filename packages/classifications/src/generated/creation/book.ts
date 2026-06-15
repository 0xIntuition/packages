import type { CreationProfile } from '../../creation-profile.js';

export const bookCreationProfile = {
	classification: {
		slug: 'book',
		type: 'Book',
		displayName: 'Book',
		description: 'A book identity with only the title and optional disambiguators.',
		category: 'Creative Work',
		schema: {
			context: 'https://schema.org/',
			type: 'Book',
		},
	},
	fields: [
		{
			key: 'name',
			label: 'Title',
			description: 'The title of the book.',
			fieldType: 'string',
			required: true,
			placeholder: 'The Sovereign Individual',
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
			key: 'author',
			label: 'Author',
			description: 'The author name when disambiguation is needed.',
			fieldType: 'string',
			required: false,
			placeholder: 'James Dale Davidson',
			schemaProperty: 'author',
			schema: {
				context: 'https://schema.org/',
				property: 'author',
				propertyId: 'schema:author',
				label: 'author',
				comment:
					'The author of this content or rating. Please note that author is special in that HTML 5 provides a special mechanism for indicating authorship via the rel tag. That is equivalent to this and may be used interchangeably.',
				originType: 'CreativeWork',
				originTypeId: 'schema:CreativeWork',
				rangeIncludes: ['Organization', 'Person'],
			},
		},
		{
			key: 'isbn',
			label: 'ISBN',
			description: 'The ISBN identifier when known.',
			fieldType: 'string',
			required: false,
			placeholder: '9780684832720',
			schemaProperty: 'isbn',
			schema: {
				context: 'https://schema.org/',
				property: 'isbn',
				propertyId: 'schema:isbn',
				label: 'isbn',
				comment: 'The ISBN of the book.',
				originType: 'Book',
				originTypeId: 'schema:Book',
				rangeIncludes: ['Text'],
			},
		},
		{
			key: 'sameAs',
			label: 'Canonical References',
			description: 'Canonical URLs that identify the same book.',
			fieldType: 'string[]',
			required: false,
			placeholder: 'https://openlibrary.org/...',
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
			subjectClassification: 'book',
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
			schemaMappings: [
				{
					context: 'https://schema.org/',
					property: 'author',
					match: 'semantic',
				},
			],
			priority: 'core',
		},
		{
			subjectClassification: 'book',
			predicate: {
				key: 'publisher',
				id: '0x1b3ba08e8f437a820dce9077ed0f5b853bc7c4ddc46bb3961dc9a902180ac90b',
				label: 'publisher',
				description:
					'The subject creative work or dataset was published by the object person or organization',
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
			schemaMappings: [
				{
					context: 'https://schema.org/',
					property: 'publisher',
					match: 'exact',
				},
			],
			priority: 'recommended',
		},
		{
			subjectClassification: 'book',
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
			schemaMappings: [
				{
					context: 'https://schema.org/',
					property: 'genre',
					match: 'broader',
					notes:
						'`hasCategory` supports Intuition discovery facets; schema.org `genre` is a narrower creative-work taxonomy field.',
				},
			],
			priority: 'recommended',
		},
		{
			subjectClassification: 'book',
			predicate: {
				key: 'reference',
				id: '0x8cf728a7f310d0c370911dd8aed25392de51010342d688259fdf1e7193dd2ad3',
				label: 'reference',
				description:
					"The subject work cites or refers to the object work. A forward citation link — the inverse of 'cited by'",
				status: 'proposed',
				category: 'Provenance/Evidence',
				marketPattern: 'attributive',
			},
			expectedObjects: [
				{
					kind: 'schema',
					context: 'https://schema.org/',
					type: 'CreativeWork',
				},
			],
			schemaMappings: [
				{
					context: 'https://schema.org/',
					property: 'citation',
					match: 'semantic',
				},
			],
			priority: 'optional',
		},
		{
			subjectClassification: 'book',
			predicate: {
				key: 'listedIn',
				id: '0x60669cfacc52e65837ecbd0ed02748075d00f6de64b0c9e3f2f97878fb5f6720',
				label: 'listed in',
				description:
					'The subject item appears as an entry within the object collection, stack, or curated list',
				status: 'enshrined',
				category: 'Curation/Containment',
				marketPattern: 'attributive',
			},
			expectedObjects: [
				{
					kind: 'schema',
					context: 'https://schema.org/',
					type: 'Collection',
				},
			],
			schemaMappings: [
				{
					context: 'https://schema.org/',
					property: 'isPartOf',
					match: 'semantic',
				},
			],
			priority: 'optional',
			notes: 'Use until Intuition promotes a first-class collection/list classification.',
		},
		{
			subjectClassification: 'book',
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
	availableFieldCount: 135,
} as const satisfies CreationProfile;

export const creationProfile = bookCreationProfile;
export default bookCreationProfile;
