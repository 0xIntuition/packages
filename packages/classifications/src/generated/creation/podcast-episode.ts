import type { CreationProfile } from '../../creation-profile.js';

export const podcastEpisodeCreationProfile = {
	classification: {
		slug: 'podcast-episode',
		type: 'PodcastEpisode',
		displayName: 'Podcast Episode',
		description: 'A podcast episode with a canonical episode URL.',
		category: 'Media',
		schema: {
			context: 'https://schema.org/',
			type: 'PodcastEpisode',
		},
	},
	fields: [
		{
			key: 'name',
			label: 'Episode Name',
			description: 'The title of the episode.',
			fieldType: 'string',
			required: true,
			placeholder: 'The Future of Onchain Reputation',
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
			label: 'Episode URL',
			description: 'The canonical episode URL.',
			fieldType: 'url',
			required: false,
			placeholder: 'https://example.com/podcast/episodes/onchain-reputation',
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
			key: 'partOfSeries',
			label: 'Series',
			description: 'The series name or URL the episode belongs to.',
			fieldType: 'string',
			required: false,
			placeholder: 'https://example.com/podcast',
			schemaProperty: 'partOfSeries',
			schema: {
				context: 'https://schema.org/',
				property: 'partOfSeries',
				propertyId: 'schema:partOfSeries',
				label: 'partOfSeries',
				comment: 'The series to which this episode or season belongs.',
				originType: 'Episode',
				originTypeId: 'schema:Episode',
				rangeIncludes: ['CreativeWorkSeries'],
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
			key: 'feedGuid',
			label: 'Feed GUID',
			description: 'The Podcasting 2.0 GUID of the feed this item belongs to.',
			fieldType: 'string',
			required: false,
			placeholder: '917393e3-1b1e-5cef-ace4-edaa54e1f810',
			schema: null,
		},
		{
			key: 'itemGuid',
			label: 'Item GUID',
			description: 'The RSS <guid> value of this episode item within its feed.',
			fieldType: 'string',
			required: false,
			placeholder: 'urn:example:ep42',
			schema: null,
		},
		{
			key: 'sameAs',
			label: 'Canonical References',
			description: 'Canonical URLs that identify the same podcast episode.',
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
			subjectClassification: 'podcast-episode',
			predicate: {
				key: 'partOfSeries',
				id: '0xe8cbe7b41fa96e8057cdbe5283041981ba4c9fd050e13d357723979d5ae9568d',
				label: 'part of series',
				description: 'The subject episode or creative work belongs to the object series',
				status: 'proposed',
				category: 'Curation/Containment',
				marketPattern: 'attributive',
			},
			expectedObjects: [
				{
					kind: 'classification',
					slug: 'podcast-series',
				},
			],
		},
		{
			subjectClassification: 'podcast-episode',
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
			subjectClassification: 'podcast-episode',
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
			subjectClassification: 'podcast-episode',
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
			subjectClassification: 'podcast-episode',
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
	availableFieldCount: 140,
} as const satisfies CreationProfile;

export const creationProfile = podcastEpisodeCreationProfile;
export default podcastEpisodeCreationProfile;
