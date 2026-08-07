import type { CreationProfile } from '../../creation-profile.js';

export const localBusinessCreationProfile = {
	classification: {
		slug: 'local-business',
		type: 'LocalBusiness',
		displayName: 'Local Business',
		description: 'A local business identity with optional address and contact disambiguators.',
		category: 'Entity',
		schema: {
			context: 'https://schema.org/',
			type: 'LocalBusiness',
		},
	},
	fields: [
		{
			key: 'name',
			label: 'Business Name',
			description: 'The local business name.',
			fieldType: 'string',
			required: true,
			placeholder: 'Blue Bottle Coffee',
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
			description: 'The street address when needed.',
			fieldType: 'string',
			required: false,
			placeholder: '66 Mint St, San Francisco, CA',
			schemaProperty: 'address',
			schema: {
				context: 'https://schema.org/',
				property: 'address',
				propertyId: 'schema:address',
				label: 'address',
				comment: 'Physical address of the item.',
				originType: 'Organization',
				originTypeId: 'schema:Organization',
				rangeIncludes: ['PostalAddress', 'Text'],
			},
		},
		{
			key: 'telephone',
			label: 'Telephone',
			description: 'A contact telephone number when needed.',
			fieldType: 'string',
			required: false,
			placeholder: '+14152222222',
			schemaProperty: 'telephone',
			schema: {
				context: 'https://schema.org/',
				property: 'telephone',
				propertyId: 'schema:telephone',
				label: 'telephone',
				comment: 'The telephone number.',
				originType: 'Organization',
				originTypeId: 'schema:Organization',
				rangeIncludes: ['Text'],
			},
		},
		{
			key: 'url',
			label: 'Official Website',
			description: 'The official website when available.',
			fieldType: 'url',
			required: false,
			placeholder: 'https://bluebottlecoffee.com',
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
			key: 'latitude',
			label: 'Latitude',
			description: 'The latitude coordinate when known.',
			fieldType: 'number',
			required: false,
			placeholder: '37.7823',
			schemaProperty: 'latitude',
			schema: {
				context: 'https://schema.org/',
				property: 'latitude',
				propertyId: 'schema:latitude',
				label: 'latitude',
				comment:
					'The latitude of a location. For example ```37.42242``` ([WGS 84](https://en.wikipedia.org/wiki/World_Geodetic_System)).',
				originType: 'Place',
				originTypeId: 'schema:Place',
				rangeIncludes: ['Number', 'Text'],
			},
		},
		{
			key: 'longitude',
			label: 'Longitude',
			description: 'The longitude coordinate when known.',
			fieldType: 'number',
			required: false,
			placeholder: '-122.4076',
			schemaProperty: 'longitude',
			schema: {
				context: 'https://schema.org/',
				property: 'longitude',
				propertyId: 'schema:longitude',
				label: 'longitude',
				comment:
					'The longitude of a location. For example ```-122.08585``` ([WGS 84](https://en.wikipedia.org/wiki/World_Geodetic_System)).',
				originType: 'Place',
				originTypeId: 'schema:Place',
				rangeIncludes: ['Number', 'Text'],
			},
		},
		{
			key: 'sameAs',
			label: 'Canonical References',
			description: 'Canonical references for the same business.',
			fieldType: 'string[]',
			required: false,
			placeholder: 'https://maps.google.com/?cid=example',
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
			subjectClassification: 'local-business',
			predicate: {
				key: 'branchOf',
				id: '0x5ec48ef77880acba5d340787e32107171df17fc9b354483fe13ec4b73aa2148c',
				label: 'branch of',
				description: 'The subject local business is a branch of the object organization',
				status: 'proposed',
				category: 'Affiliation/Membership',
				marketPattern: 'attributive',
			},
			expectedObjects: [
				{
					kind: 'classification',
					slug: 'local-business',
				},
				{
					kind: 'classification',
					slug: 'company',
				},
			],
		},
		{
			subjectClassification: 'local-business',
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
			subjectClassification: 'local-business',
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
			subjectClassification: 'local-business',
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
			subjectClassification: 'local-business',
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
			subjectClassification: 'local-business',
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
	availableFieldCount: 127,
} as const satisfies CreationProfile;

export const creationProfile = localBusinessCreationProfile;
export default localBusinessCreationProfile;
