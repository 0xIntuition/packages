import type { CreationProfile } from '../../creation-profile.js';

export const videoObjectCreationProfile = {
	classification: {
		slug: 'video-object',
		type: 'VideoObject',
		displayName: 'Video Object',
		description: 'A video identity with optional description and content URL.',
		category: 'Media',
		schema: {
			context: 'https://schema.org/',
			type: 'VideoObject',
		},
	},
	fields: [
		{
			key: 'name',
			label: 'Video Title',
			description: 'The title of the video.',
			fieldType: 'string',
			required: true,
			placeholder: 'How Intuition Works',
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
			key: 'description',
			label: 'Description',
			description: 'A short description of the video.',
			fieldType: 'string',
			required: false,
			placeholder: 'A walkthrough of the Intuition protocol.',
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
			key: 'contentUrl',
			label: 'Content URL',
			description: 'The video content or canonical URL.',
			fieldType: 'url',
			required: false,
			placeholder: 'https://example.com/videos/how-intuition-works',
			schemaProperty: 'contentUrl',
			schema: {
				context: 'https://schema.org/',
				property: 'contentUrl',
				propertyId: 'schema:contentUrl',
				label: 'contentUrl',
				comment: 'Actual bytes of the media object, for example the image file or video file.',
				originType: 'MediaObject',
				originTypeId: 'schema:MediaObject',
				rangeIncludes: ['URL'],
			},
		},
		{
			key: 'contentHash',
			label: 'Content Hash',
			description: 'Hash of the video bytes as alg:hex, e.g. sha256:<hex>.',
			fieldType: 'string',
			required: false,
			placeholder: 'sha256:9f86d081884c7d65…',
			schema: null,
		},
		{
			key: 'sameAs',
			label: 'Canonical References',
			description: 'Canonical URLs for the same video.',
			fieldType: 'string[]',
			required: false,
			placeholder: 'https://www.youtube.com/watch?v=example',
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
			subjectClassification: 'video-object',
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
			subjectClassification: 'video-object',
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
			subjectClassification: 'video-object',
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
		},
		{
			subjectClassification: 'video-object',
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
			subjectClassification: 'video-object',
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
			subjectClassification: 'video-object',
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
			subjectClassification: 'video-object',
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
			subjectClassification: 'video-object',
			predicate: {
				key: 'imgUrl',
				id: '0x9f2f3089c1f61cae97bc0a50bb199854489df1971641336f9247395131eaba2f',
				label: 'imgUrl',
				description:
					'Links the subject atom to an image URL. Legacy camelCase naming retained for backward compatibility',
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
	],
	availableFieldCount: 157,
} as const satisfies CreationProfile;

export const creationProfile = videoObjectCreationProfile;
export default videoObjectCreationProfile;
