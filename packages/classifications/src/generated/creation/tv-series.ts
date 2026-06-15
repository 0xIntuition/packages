import type { CreationProfile } from '../../creation-profile.js';

export const tvSeriesCreationProfile = {
	classification: {
		slug: 'tv-series',
		type: 'TVSeries',
		displayName: 'TV Series',
		description: 'A television series identity with optional start and end dates.',
		category: 'Media',
		schema: {
			context: 'https://schema.org/',
			type: 'TVSeries',
		},
	},
	fields: [
		{
			key: 'name',
			label: 'Series Title',
			description: 'The name of the TV series.',
			fieldType: 'string',
			required: true,
			placeholder: 'Severance',
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
			key: 'startDate',
			label: 'Start Date',
			description: 'The series start date.',
			fieldType: 'iso-date',
			required: false,
			placeholder: '2022-02-18',
			schemaProperty: 'startDate',
			schema: {
				context: 'https://schema.org/',
				property: 'startDate',
				propertyId: 'schema:startDate',
				label: 'startDate',
				comment:
					'The start date and time of the item (in [ISO 8601 date format](http://en.wikipedia.org/wiki/ISO_8601)).',
				originType: 'CreativeWorkSeries',
				originTypeId: 'schema:CreativeWorkSeries',
				rangeIncludes: ['Date', 'DateTime'],
			},
		},
		{
			key: 'endDate',
			label: 'End Date',
			description: 'The series end date when known.',
			fieldType: 'iso-date',
			required: false,
			placeholder: '2026-03-01',
			schemaProperty: 'endDate',
			schema: {
				context: 'https://schema.org/',
				property: 'endDate',
				propertyId: 'schema:endDate',
				label: 'endDate',
				comment:
					'The end date and time of the item (in [ISO 8601 date format](http://en.wikipedia.org/wiki/ISO_8601)).',
				originType: 'CreativeWorkSeries',
				originTypeId: 'schema:CreativeWorkSeries',
				rangeIncludes: ['Date', 'DateTime'],
			},
		},
		{
			key: 'sameAs',
			label: 'Canonical References',
			description: 'Canonical URLs for the same series.',
			fieldType: 'string[]',
			required: false,
			placeholder: 'https://www.imdb.com/title/tt11280740/',
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
			subjectClassification: 'tv-series',
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
		{
			subjectClassification: 'tv-series',
			predicate: {
				key: 'director',
				id: '0xb5615fb82280ab71bcd06493b5028a5909b09288230a7eade6765b1095686c88',
				label: 'director',
				description: 'The subject media work was directed by the object person',
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
			subjectClassification: 'tv-series',
			predicate: {
				key: 'productionCompany',
				id: '0xb2a18c47b1fd2be0471997279089c2c0b2b7bdda39ee01b9f511e16081712a78',
				label: 'production company',
				description: 'The subject media work was produced by the object organization',
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
			subjectClassification: 'tv-series',
			predicate: {
				key: 'trailer',
				id: '0x498107ee5d558569166098517065b028b478ffe177d1d13bc50d8251814b0ab5',
				label: 'trailer',
				description: 'The subject media work has the object video as its trailer',
				status: 'proposed',
				category: 'Metadata/Linking',
				marketPattern: 'attributive',
			},
			expectedObjects: [
				{
					kind: 'classification',
					slug: 'video-object',
				},
			],
		},
		{
			subjectClassification: 'tv-series',
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
	availableFieldCount: 147,
} as const satisfies CreationProfile;

export const creationProfile = tvSeriesCreationProfile;
export default tvSeriesCreationProfile;
