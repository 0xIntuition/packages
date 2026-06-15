import type { CreationProfile } from '../../creation-profile.js';

export const softwareCreationProfile = {
	classification: {
		slug: 'software',
		type: 'SoftwareSourceCode',
		displayName: 'Software',
		description: 'A code project or software identity with a canonical repository URL.',
		category: 'Product',
		schema: {
			context: 'https://schema.org/',
			type: 'SoftwareSourceCode',
		},
	},
	fields: [
		{
			key: 'name',
			label: 'Software Name',
			description: 'The software or project name.',
			fieldType: 'string',
			required: true,
			placeholder: 'intuition-data-structure',
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
			key: 'codeRepository',
			label: 'Repository URL',
			description: 'The canonical code repository URL.',
			fieldType: 'url',
			required: true,
			placeholder: 'https://github.com/0xintuition/intuition-data-structure',
			schemaProperty: 'codeRepository',
			schema: {
				context: 'https://schema.org/',
				property: 'codeRepository',
				propertyId: 'schema:codeRepository',
				label: 'codeRepository',
				comment:
					'Link to the repository where the un-compiled, human readable code and related code is located (SVN, GitHub, CodePlex).',
				originType: 'SoftwareSourceCode',
				originTypeId: 'schema:SoftwareSourceCode',
				rangeIncludes: ['URL'],
			},
		},
		{
			key: 'sameAs',
			label: 'Canonical References',
			description: 'Canonical URLs that identify the same software.',
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
			subjectClassification: 'software',
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
			subjectClassification: 'software',
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
			subjectClassification: 'software',
			predicate: {
				key: 'implement',
				id: '0xfdcee9a5a6150ffa458518d0f1b50eeed5f42b6aee269aab71d00d869d6fbbd1',
				label: 'implement',
				description:
					'The subject contract, application, or system implements the object standard, specification, or interface',
				status: 'proposed',
				category: 'Domain-Specific',
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
			subjectClassification: 'software',
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
			subjectClassification: 'software',
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

export const creationProfile = softwareCreationProfile;
export default softwareCreationProfile;
