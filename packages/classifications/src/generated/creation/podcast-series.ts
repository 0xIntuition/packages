import type { CreationProfile } from '../../creation-profile.js';

export const podcastSeriesCreationProfile = {
	classification: {
		slug: 'podcast-series',
		type: 'PodcastSeries',
		displayName: 'Podcast Series',
		description: 'A podcast series identity with a canonical series URL.',
		category: 'Media',
		schema: {
			context: 'https://schema.org/',
			type: 'PodcastSeries',
		},
	},
	fields: [
		{
			key: 'name',
			label: 'Series Name',
			description: 'The name of the podcast series.',
			fieldType: 'string',
			required: true,
			placeholder: 'Bankless',
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
			label: 'Series URL',
			description: 'The canonical podcast series URL.',
			fieldType: 'url',
			required: false,
			placeholder: 'https://www.bankless.com/podcast',
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
			key: 'feedUrl',
			label: 'RSS Feed URL',
			description: 'The RSS feed URL; used to derive the Podcasting 2.0 GUID.',
			fieldType: 'url',
			required: false,
			placeholder: 'https://feeds.example.com/show.xml',
			schemaProperty: 'webFeed',
			schema: {
				context: 'https://schema.org/',
				property: 'webFeed',
				propertyId: 'schema:webFeed',
				label: 'webFeed',
				comment:
					'The URL for a feed, e.g. associated with a podcast series, blog, or series of date-stamped updates. This is usually RSS or Atom.',
				originType: 'PodcastSeries',
				originTypeId: 'schema:PodcastSeries',
				rangeIncludes: ['DataFeed', 'URL'],
			},
		},
		{
			key: 'podcastGuid',
			label: 'Podcast GUID',
			description: 'The declared Podcasting 2.0 <podcast:guid> value; survives feed migrations.',
			fieldType: 'string',
			required: false,
			placeholder: '917393e3-1b1e-5cef-ace4-edaa54e1f810',
			schema: null,
		},
		{
			key: 'sameAs',
			label: 'Canonical References',
			description: 'Canonical references for the same podcast.',
			fieldType: 'string[]',
			required: false,
			placeholder: 'https://open.spotify.com/show/example',
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
			subjectClassification: 'podcast-series',
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
			subjectClassification: 'podcast-series',
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
		{
			subjectClassification: 'podcast-series',
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
			subjectClassification: 'podcast-series',
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
			subjectClassification: 'podcast-series',
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
			subjectClassification: 'podcast-series',
			predicate: {
				key: 'actor',
				id: '0x7c9a29122ab978cd91542fc76f6c7a1d99d65362d41a308863bd295462051196',
				label: 'actor',
				description: 'The subject creative work features the object actor or performing group',
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
	],
	availableFieldCount: 134,
} as const satisfies CreationProfile;

export const creationProfile = podcastSeriesCreationProfile;
export default podcastSeriesCreationProfile;
