import type { CreationProfile } from '../../creation-profile.js';

export const musicGroupCreationProfile = {
	classification: {
		slug: 'music-group',
		type: 'MusicGroup',
		displayName: 'Music Group',
		description: 'A band or artist identity.',
		category: 'Media',
		schema: {
			context: 'https://schema.org/',
			type: 'MusicGroup',
		},
	},
	fields: [
		{
			key: 'name',
			label: 'Artist or Group Name',
			description: 'The artist or group name.',
			fieldType: 'string',
			required: true,
			placeholder: 'Daft Punk',
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
			key: 'sameAs',
			label: 'Canonical References',
			description: 'Canonical URLs that identify the same music group.',
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
			subjectClassification: 'music-group',
			predicate: {
				key: 'musicGroupMember',
				id: '0xdd76a1d3493af1c7025099650ae515cc1ad12a0e5d44be82d6a436dc790e61ef',
				label: 'music group member',
				description: 'The subject music group includes the object person as a member',
				status: 'proposed',
				category: 'Affiliation/Membership',
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
			subjectClassification: 'music-group',
			predicate: {
				key: 'track',
				id: '0x144c129178c900adc2624ed7f85313979c955266f3b4fa56bc54c55fb1855396',
				label: 'track',
				description:
					'The subject music album, playlist, or group includes the object music recording as a track',
				status: 'proposed',
				category: 'Curation/Containment',
				marketPattern: 'attributive',
			},
			expectedObjects: [
				{
					kind: 'classification',
					slug: 'music-recording',
				},
			],
		},
		{
			subjectClassification: 'music-group',
			predicate: {
				key: 'contain',
				id: '0xa64ca3a04b63c5f6b94ba65b11a1a197767e68cca1f41ac563b5f2d34fa36597',
				label: 'contain',
				description: 'The subject collection or container includes the object as a member or entry',
				status: 'enshrined',
				category: 'Curation/Containment',
				marketPattern: 'attributive',
			},
			expectedObjects: [
				{
					kind: 'any',
					reason:
						'Containment is intentionally broad and can target any atom classification for collections or grouped entities.',
				},
			],
		},
		{
			subjectClassification: 'music-group',
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
			subjectClassification: 'music-group',
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
	availableFieldCount: 95,
} as const satisfies CreationProfile;

export const creationProfile = musicGroupCreationProfile;
export default musicGroupCreationProfile;
