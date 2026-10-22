import type { CreationProfile } from '../../creation-profile.js';

export const serviceCreationProfile = {
	classification: {
		slug: 'service',
		type: 'Service',
		displayName: 'Service',
		description: 'A service identity with optional provider and area-served disambiguators.',
		category: 'Product',
		schema: {
			context: 'https://schema.org/',
			type: 'Service',
		},
	},
	fields: [
		{
			key: 'name',
			label: 'Service Name',
			description: 'The service name.',
			fieldType: 'string',
			required: true,
			placeholder: 'ENS Name Service',
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
			key: 'provider',
			label: 'Provider',
			description: 'The provider name when needed.',
			fieldType: 'string',
			required: false,
			placeholder: 'ENS Labs',
			schemaProperty: 'provider',
			schema: {
				context: 'https://schema.org/',
				property: 'provider',
				propertyId: 'schema:provider',
				label: 'provider',
				comment:
					'The service provider, service operator, or service performer; the goods producer. Another party (a seller) may offer those services or goods on behalf of the provider. A provider may also serve as the seller.',
				originType: 'Service',
				originTypeId: 'schema:Service',
				rangeIncludes: ['Organization', 'Person'],
			},
		},
		{
			key: 'areaServed',
			label: 'Area Served',
			description: 'The served geography or audience when needed.',
			fieldType: 'string',
			required: false,
			placeholder: 'Global',
			schemaProperty: 'areaServed',
			schema: {
				context: 'https://schema.org/',
				property: 'areaServed',
				propertyId: 'schema:areaServed',
				label: 'areaServed',
				comment: 'The geographic area where a service or offered item is provided.',
				originType: 'Service',
				originTypeId: 'schema:Service',
				rangeIncludes: ['AdministrativeArea', 'GeoShape', 'Place', 'Text'],
			},
		},
		{
			key: 'sameAs',
			label: 'Canonical References',
			description: 'Canonical URLs for the same service.',
			fieldType: 'string[]',
			required: false,
			placeholder: 'https://ens.domains',
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
			subjectClassification: 'service',
			predicate: {
				key: 'provider',
				id: '0x43c466f69c3efcc05d623c8398de358b205c0de59e7785a143db51172f69c79a',
				label: 'provider',
				description:
					'The subject service, software, or creative work is provided by the object person or organization',
				status: 'proposed',
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
			subjectClassification: 'service',
			predicate: {
				key: 'areaServed',
				id: '0x863fc50bcf99d925ebc537dab0b6b190e1f4b0c17aa610aafd1835df76156b68',
				label: 'area served',
				description: 'The subject service or organization serves the object place or region',
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
			subjectClassification: 'service',
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
			subjectClassification: 'service',
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
			subjectClassification: 'service',
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
	],
	availableFieldCount: 38,
} as const satisfies CreationProfile;

export const creationProfile = serviceCreationProfile;
export default serviceCreationProfile;
