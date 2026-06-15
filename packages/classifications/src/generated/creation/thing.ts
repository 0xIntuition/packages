import type { CreationProfile } from '../../creation-profile.js';

export const thingCreationProfile = {
	classification: {
		slug: 'thing',
		type: 'Thing',
		displayName: 'Thing',
		description: 'A broad tangible or conceptual thing with a name and description.',
		category: 'Entity',
		schema: {
			context: 'https://schema.org/',
			type: 'Thing',
		},
	},
	fields: [
		{
			key: 'name',
			label: 'Thing Name',
			description: 'The name of the thing.',
			fieldType: 'string',
			required: true,
			placeholder: 'Apple',
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
			description: 'A short description of the thing.',
			fieldType: 'string',
			required: false,
			placeholder: 'A round fruit with red or green skin.',
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
			key: 'sameAs',
			label: 'Canonical References',
			description: 'Canonical URLs that identify the same thing.',
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
			subjectClassification: 'thing',
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
			subjectClassification: 'thing',
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
			subjectClassification: 'thing',
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
			subjectClassification: 'thing',
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
	],
	availableFieldCount: 13,
} as const satisfies CreationProfile;

export const creationProfile = thingCreationProfile;
export default thingCreationProfile;
