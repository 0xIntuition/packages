import type { CreationProfile } from '../../creation-profile.js';

export const newsArticleCreationProfile = {
	classification: {
		slug: 'news-article',
		type: 'NewsArticle',
		displayName: 'News Article',
		description: 'A news article with durable publication identity fields.',
		category: 'Creative Work',
		schema: {
			context: 'https://schema.org/',
			type: 'NewsArticle',
		},
	},
	fields: [
		{
			key: 'headline',
			label: 'Headline',
			description: 'The headline of the news article.',
			fieldType: 'string',
			required: true,
			placeholder: 'Intuition Launches v1',
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
			key: 'datePublished',
			label: 'Publication Date',
			description: 'The publication date.',
			fieldType: 'iso-date',
			required: false,
			placeholder: '2026-02-26',
			schemaProperty: 'datePublished',
			schema: {
				context: 'https://schema.org/',
				property: 'datePublished',
				propertyId: 'schema:datePublished',
				label: 'datePublished',
				comment:
					'Date of first publication or broadcast. For example the date a [[CreativeWork]] was broadcast or a [[Certification]] was issued.',
				originType: 'CreativeWork',
				originTypeId: 'schema:CreativeWork',
				rangeIncludes: ['Date', 'DateTime'],
			},
		},
		{
			key: 'url',
			label: 'Article URL',
			description: 'The canonical article URL.',
			fieldType: 'url',
			required: false,
			placeholder: 'https://example.com/news/intuition-launches-v1',
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
			description: 'Canonical references for the same article.',
			fieldType: 'string[]',
			required: false,
			placeholder: 'https://example.com/news/intuition-launches-v1',
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
			subjectClassification: 'news-article',
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
			subjectClassification: 'news-article',
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
			subjectClassification: 'news-article',
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
			subjectClassification: 'news-article',
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
			subjectClassification: 'news-article',
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
			subjectClassification: 'news-article',
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
		{
			subjectClassification: 'news-article',
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
	],
	availableFieldCount: 141,
} as const satisfies CreationProfile;

export const creationProfile = newsArticleCreationProfile;
export default newsArticleCreationProfile;
