import type { CreationProfile } from '../../creation-profile.js';

export const movieCreationProfile = {
	classification: {
		slug: 'movie',
		type: 'Movie',
		displayName: 'Movie',
		description: 'A movie identity with release-date disambiguation when needed.',
		category: 'Media',
		schema: {
			context: 'https://schema.org/',
			type: 'Movie',
		},
	},
	fields: [
		{
			key: 'name',
			label: 'Movie Title',
			description: 'The title of the movie.',
			fieldType: 'string',
			required: true,
			placeholder: 'Inception',
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
			key: 'datePublished',
			label: 'Release Date',
			description: 'The release date when needed.',
			fieldType: 'iso-date',
			required: false,
			placeholder: '2010-07-16',
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
			key: 'sameAs',
			label: 'Canonical References',
			description: 'Canonical URLs for the same movie.',
			fieldType: 'string[]',
			required: false,
			placeholder: 'https://www.imdb.com/title/tt1375666/',
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
			subjectClassification: 'movie',
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
			schemaMappings: [
				{
					context: 'https://schema.org/',
					property: 'actor',
					match: 'exact',
				},
			],
			priority: 'core',
		},
		{
			subjectClassification: 'movie',
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
			schemaMappings: [
				{
					context: 'https://schema.org/',
					property: 'director',
					match: 'exact',
				},
			],
			priority: 'core',
		},
		{
			subjectClassification: 'movie',
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
			schemaMappings: [
				{
					context: 'https://schema.org/',
					property: 'productionCompany',
					match: 'exact',
				},
			],
			priority: 'recommended',
		},
		{
			subjectClassification: 'movie',
			predicate: {
				key: 'musicBy',
				id: '0xa4cc82010b7010b1e13216885213a43204b6cef007118aff8571cd5b574578c9',
				label: 'music by',
				description: 'The subject media work includes music by the object person or music group',
				status: 'proposed',
				category: 'Authorship/Contribution',
				marketPattern: 'attributive',
			},
			expectedObjects: [
				{
					kind: 'classification',
					slug: 'music-group',
				},
				{
					kind: 'classification',
					slug: 'person',
				},
			],
			schemaMappings: [
				{
					context: 'https://schema.org/',
					property: 'musicBy',
					match: 'exact',
				},
			],
			priority: 'optional',
		},
		{
			subjectClassification: 'movie',
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
			schemaMappings: [
				{
					context: 'https://schema.org/',
					property: 'trailer',
					match: 'exact',
				},
			],
			priority: 'recommended',
		},
		{
			subjectClassification: 'movie',
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
						'`hasCategory` supports Intuition discovery facets; schema.org `genre` is a narrower media taxonomy field.',
				},
			],
			priority: 'recommended',
		},
		{
			subjectClassification: 'movie',
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
	availableFieldCount: 139,
} as const satisfies CreationProfile;

export const creationProfile = movieCreationProfile;
export default movieCreationProfile;
