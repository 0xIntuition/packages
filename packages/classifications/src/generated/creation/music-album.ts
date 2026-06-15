import type { CreationProfile } from '../../creation-profile.js';

export const musicAlbumCreationProfile = {
	classification: {
		slug: 'music-album',
		type: 'MusicAlbum',
		displayName: 'Music Album',
		description: 'A music album identity with an optional artist disambiguator.',
		category: 'Media',
		schema: {
			context: 'https://schema.org/',
			type: 'MusicAlbum',
		},
	},
	fields: [
		{
			key: 'name',
			label: 'Album Name',
			description: 'The title of the album.',
			fieldType: 'string',
			required: true,
			placeholder: 'Discovery',
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
			key: 'byArtist',
			label: 'Artist',
			description: 'The artist name when needed.',
			fieldType: 'string',
			required: false,
			placeholder: 'Daft Punk',
			schemaProperty: 'byArtist',
			schema: {
				context: 'https://schema.org/',
				property: 'byArtist',
				propertyId: 'schema:byArtist',
				label: 'byArtist',
				comment: 'The artist that performed this album or recording.',
				originType: 'MusicAlbum',
				originTypeId: 'schema:MusicAlbum',
				rangeIncludes: ['MusicGroup', 'Person'],
			},
		},
		{
			key: 'sameAs',
			label: 'Canonical References',
			description: 'Canonical URLs that identify the same music album.',
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
			subjectClassification: 'music-album',
			predicate: {
				key: 'byArtist',
				id: '0x13d5d4ad6ae3a4e1b5043141b6ce4633c2df4646eaefc9e45eba899c45ce235b',
				label: 'by artist',
				description: 'The subject music work was created or performed by the object artist',
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
		},
		{
			subjectClassification: 'music-album',
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
			subjectClassification: 'music-album',
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
					kind: 'classification',
					slug: 'music-recording',
				},
				{
					kind: 'any',
					reason:
						'Containment is intentionally broad and can target any atom classification for collections or grouped entities.',
				},
			],
		},
		{
			subjectClassification: 'music-album',
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
			subjectClassification: 'music-album',
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

export const creationProfile = musicAlbumCreationProfile;
export default musicAlbumCreationProfile;
