import type { CreationProfile } from '../../creation-profile.js';

export const webPageCreationProfile = {
	classification: {
		slug: 'web-page',
		type: 'WebPage',
		displayName: 'Web Page',
		description: 'A web page identity with a canonical URL.',
		category: 'Web',
		schema: {
			context: 'https://schema.org/',
			type: 'WebPage',
		},
	},
	fields: [
		{
			key: 'name',
			label: 'Page Name',
			description: 'The page title or name.',
			fieldType: 'string',
			required: true,
			placeholder: 'Brad Pitt',
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
			label: 'Page URL',
			description: 'The canonical page URL.',
			fieldType: 'url',
			required: true,
			placeholder: 'https://en.wikipedia.org/wiki/Brad_Pitt',
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
			key: 'isPartOf',
			label: 'Website',
			description: 'The website name or URL that the page belongs to.',
			fieldType: 'string',
			required: false,
			placeholder: 'https://en.wikipedia.org',
			schemaProperty: 'isPartOf',
			schema: {
				context: 'https://schema.org/',
				property: 'isPartOf',
				propertyId: 'schema:isPartOf',
				label: 'isPartOf',
				comment:
					'Indicates an item or CreativeWork that this item, or CreativeWork (in some sense), is part of.',
				originType: 'CreativeWork',
				originTypeId: 'schema:CreativeWork',
				rangeIncludes: ['CreativeWork', 'URL'],
			},
		},
		{
			key: 'sameAs',
			label: 'Canonical References',
			description: 'Canonical URLs that identify the same web page.',
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
			subjectClassification: 'web-page',
			predicate: {
				key: 'listedIn',
				id: '0x60669cfacc52e65837ecbd0ed02748075d00f6de64b0c9e3f2f97878fb5f6720',
				label: 'listed in',
				description:
					'The subject item appears as an entry within the object collection, stack, or curated list',
				status: 'enshrined',
				category: 'Curation/Containment',
				marketPattern: 'attributive',
			},
			expectedObjects: [
				{
					kind: 'schema',
					context: 'https://schema.org/',
					type: 'Collection',
				},
			],
			notes: 'Use until Intuition promotes a first-class collection/list classification.',
		},
		{
			subjectClassification: 'web-page',
			predicate: {
				key: 'authoredBy',
				id: '0x19e5da5af4adf03fb4d69e6910be4f17f9c612d98f150d2e9e0f3569cea304a9',
				label: 'authored by',
				description: 'The subject content was written or composed by the object actor',
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
			subjectClassification: 'web-page',
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
			subjectClassification: 'web-page',
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
			subjectClassification: 'web-page',
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
	availableFieldCount: 139,
} as const satisfies CreationProfile;

export const creationProfile = webPageCreationProfile;
export default webPageCreationProfile;
