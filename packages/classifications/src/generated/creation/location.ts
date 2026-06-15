import type { CreationProfile } from '../../creation-profile.js';

export const locationCreationProfile = {
	classification: {
		slug: 'location',
		type: 'Place',
		displayName: 'Location',
		description: 'A place identity with optional address and canonical references.',
		category: 'Entity',
		schema: {
			context: 'https://schema.org/',
			type: 'Place',
		},
	},
	fields: [
		{
			key: 'name',
			label: 'Location Name',
			description: 'The place name.',
			fieldType: 'string',
			required: true,
			placeholder: 'Golden Gate Bridge',
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
			key: 'address',
			label: 'Address',
			description: 'The address when needed for disambiguation.',
			fieldType: 'string',
			required: false,
			placeholder: 'San Francisco, CA 94129',
			schemaProperty: 'address',
			schema: {
				context: 'https://schema.org/',
				property: 'address',
				propertyId: 'schema:address',
				label: 'address',
				comment: 'Physical address of the item.',
				originType: 'Place',
				originTypeId: 'schema:Place',
				rangeIncludes: ['PostalAddress', 'Text'],
			},
		},
		{
			key: 'sameAs',
			label: 'Canonical References',
			description: 'Canonical URLs for the same place.',
			fieldType: 'string[]',
			required: false,
			placeholder: 'https://www.wikidata.org/wiki/Q474',
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
			subjectClassification: 'location',
			predicate: {
				key: 'containedInPlace',
				id: '0x5a26a9bd3ae73815e33de43ff44356bd60b19ed3fb243023d4318def9ce620fc',
				label: 'contained in place',
				description: 'The subject place or local business is contained within the object place',
				status: 'proposed',
				category: 'Curation/Containment',
				marketPattern: 'attributive',
			},
			expectedObjects: [
				{
					kind: 'classification',
					slug: 'location',
				},
				{
					kind: 'classification',
					slug: 'local-business',
				},
			],
		},
		{
			subjectClassification: 'location',
			predicate: {
				key: 'containsPlace',
				id: '0x39ec6c00d1c5bb25a68ea6e4d6baa5faebecd6314f1cb4c5b28069d696864395',
				label: 'contains place',
				description: 'The subject place contains the object place or local business',
				status: 'proposed',
				category: 'Curation/Containment',
				marketPattern: 'attributive',
			},
			expectedObjects: [
				{
					kind: 'classification',
					slug: 'location',
				},
				{
					kind: 'classification',
					slug: 'local-business',
				},
			],
		},
		{
			subjectClassification: 'location',
			predicate: {
				key: 'locatedIn',
				id: '0x165f0f2f51314106e280a6e6a828dda617322e7ee861dfcdad42f3f1faf7c781',
				label: 'located in',
				description:
					'Asserts that the subject is geographically or logically situated within the object location',
				status: 'proposed',
				category: 'Metadata/Linking',
				marketPattern: 'attributive',
			},
			expectedObjects: [
				{
					kind: 'classification',
					slug: 'location',
				},
			],
		},
		{
			subjectClassification: 'location',
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
			subjectClassification: 'location',
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
			subjectClassification: 'location',
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
	availableFieldCount: 60,
} as const satisfies CreationProfile;

export const creationProfile = locationCreationProfile;
export default locationCreationProfile;
