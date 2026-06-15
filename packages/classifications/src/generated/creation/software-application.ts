import type { CreationProfile } from '../../creation-profile.js';

export const softwareApplicationCreationProfile = {
	classification: {
		slug: 'software-application',
		type: 'SoftwareApplication',
		displayName: 'Software Application',
		description: 'A software application identity with optional category and platform metadata.',
		category: 'Product',
		schema: {
			context: 'https://schema.org/',
			type: 'SoftwareApplication',
		},
	},
	fields: [
		{
			key: 'name',
			label: 'Application Name',
			description: 'The software application name.',
			fieldType: 'string',
			required: true,
			placeholder: 'Notion',
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
			key: 'applicationCategory',
			label: 'Application Category',
			description: 'The application category when needed.',
			fieldType: 'string',
			required: false,
			placeholder: 'Productivity',
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
			key: 'operatingSystem',
			label: 'Operating System',
			description: 'The target operating system when needed.',
			fieldType: 'string',
			required: false,
			placeholder: 'Web',
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
			key: 'url',
			label: 'Application URL',
			description: 'The canonical app URL.',
			fieldType: 'url',
			required: false,
			placeholder: 'https://www.notion.so',
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
			description: 'Canonical URLs that identify the same software application.',
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
			subjectClassification: 'software-application',
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
			schemaMappings: [
				{
					context: 'https://schema.org/',
					property: 'url',
					match: 'exact',
				},
			],
			priority: 'recommended',
		},
		{
			subjectClassification: 'software-application',
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
			subjectClassification: 'software-application',
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
					property: 'applicationCategory',
					match: 'broader',
					notes:
						'`hasCategory` supports Intuition discovery facets; schema.org `applicationCategory` is app-specific taxonomy.',
				},
			],
			priority: 'recommended',
		},
		{
			subjectClassification: 'software-application',
			predicate: {
				key: 'compatibleWith',
				id: '0x7cc0975a6e368c14bf4b64d33befd656b6091ba7a4686d4a8e250b39e43d475d',
				label: 'compatible with',
				description:
					'The subject works correctly or interoperates with the object system, standard, or platform',
				status: 'proposed',
				category: 'Domain-Specific',
				marketPattern: 'attributive',
			},
			expectedObjects: [
				{
					kind: 'schema',
					context: 'https://schema.org/',
					type: 'SoftwareApplication',
				},
			],
			schemaMappings: [
				{
					context: 'https://schema.org/',
					property: 'softwareRequirements',
					match: 'semantic',
				},
			],
			priority: 'optional',
		},
		{
			subjectClassification: 'software-application',
			predicate: {
				key: 'softwareAddOn',
				id: '0x5e264c12e3d97061d9c9562f296ae1f31b806fd90cddd5a7cddd8e0f17008bee',
				label: 'software add on',
				description:
					'The subject software application supports the object software application as an add-on',
				status: 'proposed',
				category: 'Domain-Specific',
				marketPattern: 'attributive',
			},
			expectedObjects: [
				{
					kind: 'classification',
					slug: 'software-application',
				},
			],
			schemaMappings: [
				{
					context: 'https://schema.org/',
					property: 'softwareAddOn',
					match: 'exact',
				},
			],
			priority: 'optional',
		},
		{
			subjectClassification: 'software-application',
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
	availableFieldCount: 154,
} as const satisfies CreationProfile;

export const creationProfile = softwareApplicationCreationProfile;
export default softwareApplicationCreationProfile;
