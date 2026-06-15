import type { CreationProfile } from '../../creation-profile.js';

export const articleCreationProfile = {
	classification: {
		slug: 'article',
		type: 'Article',
		displayName: 'Article',
		description: 'A written article with a durable headline and canonical URL.',
		category: 'Creative Work',
		schema: {
			context: 'https://schema.org/',
			type: 'Article',
		},
	},
	fields: [
		{
			key: 'headline',
			label: 'Headline',
			description: 'The title or headline of the article.',
			fieldType: 'string',
			required: true,
			placeholder: 'Intuition Is Taking Over The World',
			schemaProperty: 'headline',
			schema: {
				context: 'https://schema.org/',
				property: 'headline',
				propertyId: 'schema:headline',
				label: 'headline',
				comment: 'Headline of the article.',
				originType: 'CreativeWork',
				originTypeId: 'schema:CreativeWork',
				rangeIncludes: ['Text'],
			},
		},
		{
			key: 'description',
			label: 'Description',
			description: 'A short summary of the article.',
			fieldType: 'string',
			required: false,
			placeholder: 'Intuition, the onchain knowledge graph, is taking over the world.',
			schemaProperty: 'description',
			schema: {
				context: 'https://schema.org/',
				property: 'description',
				propertyId: 'schema:description',
				label: 'description',
				comment: 'A description of the item.',
				originType: 'Thing',
				originTypeId: 'schema:Thing',
				rangeIncludes: ['Text', 'TextObject'],
			},
		},
		{
			key: 'url',
			label: 'Article URL',
			description: 'The canonical article URL.',
			fieldType: 'url',
			required: false,
			placeholder: 'https://example.com/article',
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
			key: 'sameAs',
			label: 'Canonical References',
			description: 'Canonical URLs that identify the same article.',
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
			subjectClassification: 'article',
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
			subjectClassification: 'article',
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
		},
		{
			subjectClassification: 'article',
			predicate: {
				key: 'hasDescription',
				id: '0x7026ee74d00fc4bc448cf761b239defe0165b0c5b7be2532adb5b8acae612ab4',
				label: 'has description',
				description: 'Attaches a textual description atom to the subject entity',
				status: 'enshrined',
				category: 'Metadata/Linking',
				marketPattern: 'attributive',
			},
			expectedObjects: [
				{
					kind: 'primitive',
					valueType: 'string',
				},
			],
		},
		{
			subjectClassification: 'article',
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
			subjectClassification: 'article',
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
				{
					kind: 'any',
					reason:
						'References can target many atom classifications; use narrower rows later where product semantics require them.',
				},
			],
		},
		{
			subjectClassification: 'article',
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
			notes: 'Use until Intuition promotes a first-class collection/list classification.',
		},
		{
			subjectClassification: 'article',
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
			subjectClassification: 'article',
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
	availableFieldCount: 136,
} as const satisfies CreationProfile;

export const creationProfile = articleCreationProfile;
export default articleCreationProfile;
