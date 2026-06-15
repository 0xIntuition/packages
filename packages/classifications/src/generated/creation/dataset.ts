import type { CreationProfile } from '../../creation-profile.js';

export const datasetCreationProfile = {
	classification: {
		slug: 'dataset',
		type: 'Dataset',
		displayName: 'Dataset',
		description: 'A dataset identity with a canonical dataset URL.',
		category: 'Creative Work',
		schema: {
			context: 'https://schema.org/',
			type: 'Dataset',
		},
	},
	fields: [
		{
			key: 'name',
			label: 'Dataset Name',
			description: 'The name of the dataset.',
			fieldType: 'string',
			required: true,
			placeholder: 'Global Surface Temperature',
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
			label: 'Dataset URL',
			description: 'The canonical dataset URL.',
			fieldType: 'url',
			required: false,
			placeholder: 'https://example.org/datasets/global-surface-temperature',
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
			description: 'Canonical references such as DOI links.',
			fieldType: 'string[]',
			required: false,
			placeholder: 'https://doi.org/10.1234/example-dataset',
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
			subjectClassification: 'dataset',
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
			subjectClassification: 'dataset',
			predicate: {
				key: 'publisher',
				id: '0x1b3ba08e8f437a820dce9077ed0f5b853bc7c4ddc46bb3961dc9a902180ac90b',
				label: 'publisher',
				description:
					'The subject creative work or dataset was published by the object person or organization',
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
			subjectClassification: 'dataset',
			predicate: {
				key: 'reference',
				id: '0x8cf728a7f310d0c370911dd8aed25392de51010342d688259fdf1e7193dd2ad3',
				label: 'reference',
				description:
					"The subject work cites or refers to the object work. A forward citation link — the inverse of 'cited by'",
				status: 'proposed',
				category: 'Provenance/Evidence',
				marketPattern: 'attributive',
			},
			expectedObjects: [
				{
					kind: 'schema',
					context: 'https://schema.org/',
					type: 'CreativeWork',
				},
				{
					kind: 'any',
					reason:
						'References can target many atom classifications; use narrower rows later where product semantics require them.',
				},
			],
		},
		{
			subjectClassification: 'dataset',
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
			subjectClassification: 'dataset',
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
	availableFieldCount: 138,
} as const satisfies CreationProfile;

export const creationProfile = datasetCreationProfile;
export default datasetCreationProfile;
