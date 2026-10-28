import type { CreationProfile } from '../../creation-profile.js';

export const definedTermCreationProfile = {
	classification: {
		slug: 'defined-term',
		type: 'DefinedTerm',
		displayName: 'Defined Term',
		description: 'A dictionary-style defined term with a short description.',
		category: 'Entity',
		schema: {
			context: 'https://schema.org/',
			type: 'DefinedTerm',
		},
	},
	fields: [
		{
			key: 'name',
			label: 'Term Name',
			description: 'The defined term name.',
			fieldType: 'string',
			required: true,
			placeholder: 'Knowledge Graph',
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
			description: 'The meaning or definition of the term.',
			fieldType: 'string',
			required: false,
			placeholder: 'Structured, semantic network that organizes data.',
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
			key: 'inDefinedTermSet',
			label: 'Term Set',
			description: 'The glossary or vocabulary the term belongs to.',
			fieldType: 'string',
			required: false,
			placeholder: 'https://schema.org',
			schemaProperty: 'inDefinedTermSet',
			schema: {
				context: 'https://schema.org/',
				property: 'inDefinedTermSet',
				propertyId: 'schema:inDefinedTermSet',
				label: 'inDefinedTermSet',
				comment: 'A [[DefinedTermSet]] that contains this term.',
				originType: 'DefinedTerm',
				originTypeId: 'schema:DefinedTerm',
				rangeIncludes: ['DefinedTermSet', 'URL'],
			},
		},
		{
			key: 'termCode',
			label: 'Term Code',
			description: 'The code identifying the term within its set.',
			fieldType: 'string',
			required: false,
			placeholder: 'merkle-tree',
			schemaProperty: 'termCode',
			schema: {
				context: 'https://schema.org/',
				property: 'termCode',
				propertyId: 'schema:termCode',
				label: 'termCode',
				comment: 'A code that identifies this [[DefinedTerm]] within a [[DefinedTermSet]].',
				originType: 'DefinedTerm',
				originTypeId: 'schema:DefinedTerm',
				rangeIncludes: ['Text'],
			},
		},
		{
			key: 'sameAs',
			label: 'Canonical References',
			description: 'Canonical URLs that identify the same defined term.',
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
			subjectClassification: 'defined-term',
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
			subjectClassification: 'defined-term',
			predicate: {
				key: 'sameAs',
				id: '0x1908b7994ca437c84c67a4799ae710355591790a726bf5890277f3aa70828c0a',
				label: 'same as',
				description:
					'Declares that the subject and object refer to the same real-world entity across different representations or naming systems',
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
			subjectClassification: 'defined-term',
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
			subjectClassification: 'defined-term',
			predicate: {
				key: 'hasCategory',
				id: '0xbf037cebba059cbb9547b784b0f667db03f08c177fc0f94c0f734cf16cdc0fa8',
				label: 'has category',
				description:
					'Places the subject within a broader categorical grouping. More formal than tags — use for structured taxonomies rather than free-form labeling',
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
			subjectClassification: 'defined-term',
			predicate: {
				key: 'hasTag',
				id: '0x137f29ea8a0422c9d1003ece2e1883e916d4a106da0a897279842ffbb793229a',
				label: 'has tag',
				description:
					'Assigns a reusable tag or keyword atom to the subject for filtering, clustering, and discovery',
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
	],
	availableFieldCount: 16,
} as const satisfies CreationProfile;

export const creationProfile = definedTermCreationProfile;
export default definedTermCreationProfile;
