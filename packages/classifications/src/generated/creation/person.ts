import type { CreationProfile } from '../../creation-profile.js';

export const personCreationProfile = {
	classification: {
		slug: 'person',
		type: 'Person',
		displayName: 'Person',
		description: 'An individual human identity using structured first and last names.',
		category: 'Entity',
		schema: {
			context: 'https://schema.org/',
			type: 'Person',
		},
	},
	fields: [
		{
			key: 'givenName',
			label: 'First Name',
			description: 'The person’s given or first name.',
			fieldType: 'string',
			required: true,
			placeholder: 'Vitalik',
			schemaProperty: 'givenName',
			schema: {
				context: 'https://schema.org/',
				property: 'givenName',
				propertyId: 'schema:givenName',
				label: 'givenName',
				comment: 'Given name. In the U.S., the first name of a Person.',
				originType: 'Person',
				originTypeId: 'schema:Person',
				rangeIncludes: ['Text'],
			},
		},
		{
			key: 'familyName',
			label: 'Last Name',
			description: 'The person’s family or last name.',
			fieldType: 'string',
			required: true,
			placeholder: 'Buterin',
			schemaProperty: 'familyName',
			schema: {
				context: 'https://schema.org/',
				property: 'familyName',
				propertyId: 'schema:familyName',
				label: 'familyName',
				comment: 'Family name. In the U.S., the last name of a Person.',
				originType: 'Person',
				originTypeId: 'schema:Person',
				rangeIncludes: ['Text'],
			},
		},
		{
			key: 'sameAs',
			label: 'Canonical References',
			description: 'Canonical URLs that identify the same person.',
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
			subjectClassification: 'person',
			predicate: {
				key: 'memberOf',
				id: '0x4650825f3c0dfa4c4faef53e4ebb3de556ae356a4c1b1265de684766690a9c99',
				label: 'member of',
				description:
					'The subject actor or entity holds membership in the object organization or group',
				status: 'proposed',
				category: 'Affiliation/Membership',
				marketPattern: 'depositional',
			},
			expectedObjects: [
				{
					kind: 'classification',
					slug: 'company',
				},
			],
			schemaMappings: [
				{
					context: 'https://schema.org/',
					property: 'memberOf',
					match: 'exact',
				},
			],
			priority: 'recommended',
		},
		{
			subjectClassification: 'person',
			predicate: {
				key: 'employedBy',
				id: '0x89968d0be91dc584b7747967541df3947129cb107b5fb97e79a4c8305eb2356e',
				label: 'employed by',
				description: 'The subject person is employed by the object organization',
				status: 'proposed',
				category: 'Affiliation/Membership',
				marketPattern: 'depositional',
			},
			expectedObjects: [
				{
					kind: 'classification',
					slug: 'company',
				},
			],
			schemaMappings: [
				{
					context: 'https://schema.org/',
					property: 'worksFor',
					match: 'semantic',
				},
			],
			priority: 'recommended',
		},
		{
			subjectClassification: 'person',
			predicate: {
				key: 'affiliatedWith',
				id: '0x65711e57db67c836afd7bdfe80b5b0d1021a83c2623c9f2dab85af5cd7d8106f',
				label: 'affiliated with',
				description:
					'A general association between the subject and object entities without implying employment or membership',
				status: 'proposed',
				category: 'Affiliation/Membership',
				marketPattern: 'depositional',
			},
			expectedObjects: [
				{
					kind: 'classification',
					slug: 'company',
				},
			],
			schemaMappings: [
				{
					context: 'https://schema.org/',
					property: 'affiliation',
					match: 'semantic',
				},
			],
			priority: 'optional',
		},
		{
			subjectClassification: 'person',
			predicate: {
				key: 'alumniOf',
				id: '0x45e98e5eef934cae066c53a0af0195e78b2c6e2c1c2077aad31466763782507c',
				label: 'alumni of',
				description: 'The subject person is an alumnus of the object organization',
				status: 'proposed',
				category: 'Affiliation/Membership',
				marketPattern: 'depositional',
			},
			expectedObjects: [
				{
					kind: 'schema',
					context: 'https://schema.org/',
					type: 'EducationalOrganization',
				},
			],
			schemaMappings: [
				{
					context: 'https://schema.org/',
					property: 'alumniOf',
					match: 'exact',
				},
			],
			priority: 'optional',
			notes:
				'EducationalOrganization is schema.org-backed until Intuition promotes a school/university classification.',
		},
		{
			subjectClassification: 'person',
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
			subjectClassification: 'person',
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
	],
	availableFieldCount: 81,
} as const satisfies CreationProfile;

export const creationProfile = personCreationProfile;
export default personCreationProfile;
