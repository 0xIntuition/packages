import type { CreationProfile } from '../../creation-profile.js';

export const mobileApplicationCreationProfile = {
	classification: {
		slug: 'mobile-application',
		type: 'MobileApplication',
		displayName: 'Mobile Application',
		description: 'A mobile app identity with the app name and target platforms.',
		category: 'Product',
		schema: {
			context: 'https://schema.org/',
			type: 'MobileApplication',
		},
	},
	fields: [
		{
			key: 'name',
			label: 'Application Name',
			description: 'The mobile application name.',
			fieldType: 'string',
			required: true,
			placeholder: 'Spotify',
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
			key: 'operatingSystem',
			label: 'Operating System',
			description: 'The supported operating systems.',
			fieldType: 'string',
			required: true,
			placeholder: 'iOS, Android',
			schemaProperty: 'operatingSystem',
			schema: {
				context: 'https://schema.org/',
				property: 'operatingSystem',
				propertyId: 'schema:operatingSystem',
				label: 'operatingSystem',
				comment: 'Operating systems supported (Windows 7, OS X 10.6, Android 1.6).',
				originType: 'SoftwareApplication',
				originTypeId: 'schema:SoftwareApplication',
				rangeIncludes: ['OperatingSystem', 'Text'],
			},
		},
		{
			key: 'applicationCategory',
			label: 'Application Category',
			description: 'The app category when needed.',
			fieldType: 'string',
			required: false,
			placeholder: 'Music',
			schemaProperty: 'applicationCategory',
			schema: {
				context: 'https://schema.org/',
				property: 'applicationCategory',
				propertyId: 'schema:applicationCategory',
				label: 'applicationCategory',
				comment: "Type of software application, e.g. 'Game, Multimedia'.",
				originType: 'SoftwareApplication',
				originTypeId: 'schema:SoftwareApplication',
				rangeIncludes: ['Text', 'URL'],
			},
		},
		{
			key: 'downloadUrl',
			label: 'Download URL',
			description: 'The store or download URL.',
			fieldType: 'url',
			required: false,
			placeholder: 'https://apps.apple.com/app/spotify/id324684580',
			schemaProperty: 'downloadUrl',
			schema: {
				context: 'https://schema.org/',
				property: 'downloadUrl',
				propertyId: 'schema:downloadUrl',
				label: 'downloadUrl',
				comment: 'If the file can be downloaded, URL to download the binary.',
				originType: 'SoftwareApplication',
				originTypeId: 'schema:SoftwareApplication',
				rangeIncludes: ['URL'],
			},
		},
		{
			key: 'bundleId',
			label: 'Bundle / Package ID',
			description: 'The store bundle identifier or Android package name.',
			fieldType: 'string',
			required: false,
			placeholder: 'com.spotify.music',
			schema: null,
		},
		{
			key: 'sameAs',
			label: 'Canonical References',
			description: 'Canonical URLs that identify the same mobile application.',
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
			subjectClassification: 'mobile-application',
			predicate: {
				key: 'availableOn',
				id: '0xea46b891287568210d4614fdb31147cd009ad6d7731657c5341889b3789eceeb',
				label: 'available on',
				description:
					'Indicates the subject can be accessed, purchased, or used on the object platform or chain',
				status: 'proposed',
				category: 'Metadata/Linking',
				marketPattern: 'attributive',
			},
			expectedObjects: [
				{
					kind: 'classification',
					slug: 'software',
				},
				{
					kind: 'classification',
					slug: 'software-application',
				},
				{
					kind: 'classification',
					slug: 'defined-term',
				},
			],
		},
		{
			subjectClassification: 'mobile-application',
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
			subjectClassification: 'mobile-application',
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
		{
			subjectClassification: 'mobile-application',
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
			subjectClassification: 'mobile-application',
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
	availableFieldCount: 155,
} as const satisfies CreationProfile;

export const creationProfile = mobileApplicationCreationProfile;
export default mobileApplicationCreationProfile;
