import type { CreationProfile } from '../../creation-profile.js';

export const musicRecordingCreationProfile = {
	classification: {
		slug: 'music-recording',
		type: 'MusicRecording',
		displayName: 'Music Recording',
		description: 'An individual music track with optional artist and album disambiguators.',
		category: 'Media',
		schema: {
			context: 'https://schema.org/',
			type: 'MusicRecording',
		},
	},
	fields: [
		{
			key: 'name',
			label: 'Track Name',
			description: 'The track title.',
			fieldType: 'string',
			required: true,
			placeholder: 'One More Time',
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
				originType: 'MusicRecording',
				originTypeId: 'schema:MusicRecording',
				rangeIncludes: ['MusicGroup', 'Person'],
			},
		},
		{
			key: 'inAlbum',
			label: 'Album',
			description: 'The album name when needed.',
			fieldType: 'string',
			required: false,
			placeholder: 'Discovery',
			schemaProperty: 'inAlbum',
			schema: {
				context: 'https://schema.org/',
				property: 'inAlbum',
				propertyId: 'schema:inAlbum',
				label: 'inAlbum',
				comment: 'The album to which this recording belongs.',
				originType: 'MusicRecording',
				originTypeId: 'schema:MusicRecording',
				rangeIncludes: ['MusicAlbum'],
			},
		},
		{
			key: 'isrc',
			label: 'ISRC',
			description: 'The International Standard Recording Code when known.',
			fieldType: 'string',
			required: false,
			placeholder: 'USSM10007459',
			schemaProperty: 'isrcCode',
			schema: {
				context: 'https://schema.org/',
				property: 'isrcCode',
				propertyId: 'schema:isrcCode',
				label: 'isrcCode',
				comment: 'The International Standard Recording Code for the recording.',
				originType: 'MusicRecording',
				originTypeId: 'schema:MusicRecording',
				rangeIncludes: ['Text'],
			},
		},
		{
			key: 'sameAs',
			label: 'Canonical References',
			description: 'Canonical URLs that identify the same music recording.',
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
			subjectClassification: 'music-recording',
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
			schemaMappings: [
				{
					context: 'https://schema.org/',
					property: 'byArtist',
					match: 'exact',
				},
			],
			priority: 'core',
		},
		{
			subjectClassification: 'music-recording',
			predicate: {
				key: 'inAlbum',
				id: '0xcd71dd2209ab6efb055c4545edcdbc8410f289a932a94410014b2021543b4168',
				label: 'in album',
				description: 'The subject music recording appears on the object music album',
				status: 'proposed',
				category: 'Curation/Containment',
				marketPattern: 'attributive',
			},
			expectedObjects: [
				{
					kind: 'classification',
					slug: 'music-album',
				},
			],
			schemaMappings: [
				{
					context: 'https://schema.org/',
					property: 'inAlbum',
					match: 'exact',
				},
			],
			priority: 'core',
		},
		{
			subjectClassification: 'music-recording',
			predicate: {
				key: 'inPlaylist',
				id: '0x856778688c9df8fb8be4fd949a52269b3aecfeb980d948e6fe362f8adba789d6',
				label: 'in playlist',
				description: 'The subject music recording appears in the object music playlist',
				status: 'proposed',
				category: 'Curation/Containment',
				marketPattern: 'attributive',
			},
			expectedObjects: [
				{
					kind: 'schema',
					context: 'https://schema.org/',
					type: 'MusicPlaylist',
				},
			],
			schemaMappings: [
				{
					context: 'https://schema.org/',
					property: 'inPlaylist',
					match: 'exact',
				},
			],
			priority: 'recommended',
			notes:
				'MusicPlaylist is schema.org-backed until Intuition promotes a music-playlist classification.',
		},
		{
			subjectClassification: 'music-recording',
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
						'`hasCategory` is Intuition discovery metadata; schema.org `genre` is a narrower media taxonomy field.',
				},
			],
			priority: 'recommended',
		},
		{
			subjectClassification: 'music-recording',
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
			notes:
				'Use for strict identity links only, such as Spotify and Apple Music representations of the same recording.',
		},
	],
	availableFieldCount: 135,
} as const satisfies CreationProfile;

export const creationProfile = musicRecordingCreationProfile;
export default musicRecordingCreationProfile;
