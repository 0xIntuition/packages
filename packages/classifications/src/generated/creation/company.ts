import type { CreationProfile } from '../../creation-profile.js';

export const companyCreationProfile = {
	classification: {
		slug: 'company',
		type: 'Organization',
		displayName: 'Company',
		description: 'An organization identity with optional canonical references.',
		category: 'Entity',
		schema: {
			context: 'https://schema.org/',
			type: 'Organization',
		},
	},
	fields: [
		{
			key: 'name',
			label: 'Company Name',
			description: 'The official or common company name.',
			fieldType: 'string',
			required: true,
			placeholder: 'Intuition Labs',
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
			label: 'Official Website',
			description: 'The official company website when needed.',
			fieldType: 'url',
			required: false,
			placeholder: 'https://intuition.systems',
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
			description: 'Canonical URLs for the same organization.',
			fieldType: 'string[]',
			required: false,
			placeholder: 'https://www.wikidata.org/wiki/...',
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
			subjectClassification: 'company',
			predicate: {
				key: 'founder',
				id: '0x12798cbb0392c40e4e46c692ee94c7345032a9a4970e26c4821920cd12832591',
				label: 'founder',
				description:
					'The subject organization or business was founded by the object person or organization',
				status: 'proposed',
				category: 'Affiliation/Membership',
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
			subjectClassification: 'company',
			predicate: {
				key: 'founded',
				id: '0xcbcfeb175813f275b952eb9df762bef10fe90e16bc8bbc1b1b21a2565b7ad16b',
				label: 'founded',
				description:
					'The subject actor established or co-founded the object organization or project',
				status: 'proposed',
				category: 'Affiliation/Membership',
				marketPattern: 'attributive',
			},
			expectedObjects: [
				{
					kind: 'classification',
					slug: 'company',
				},
				{
					kind: 'classification',
					slug: 'software',
				},
				{
					kind: 'classification',
					slug: 'software-application',
				},
			],
		},
		{
			subjectClassification: 'company',
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
		},
		{
			subjectClassification: 'company',
			predicate: {
				key: 'parentOrganization',
				id: '0x5d93f5ba8db84190cc557cc9288caf032206e9c880c9a16e5333af2067fdc59c',
				label: 'parent organization',
				description: 'The subject organization is a child or subsidiary of the object organization',
				status: 'proposed',
				category: 'Affiliation/Membership',
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
			subjectClassification: 'company',
			predicate: {
				key: 'subOrganization',
				id: '0xa5ab1dbf1c7c40f0961d40edc215d3b0a2666301a57a4b72b2809e69e4954991',
				label: 'sub organization',
				description:
					'The subject organization has the object organization as a child or subsidiary',
				status: 'proposed',
				category: 'Affiliation/Membership',
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
			subjectClassification: 'company',
			predicate: {
				key: 'brand',
				id: '0xb4bff7194354fe3119bbf4c207a8128bd174242d728668f14e6d80fb05bff74d',
				label: 'brand',
				description:
					'The subject product, service, or organization is associated with the object brand',
				status: 'proposed',
				category: 'Identity/Classification',
				marketPattern: 'attributive',
			},
			expectedObjects: [
				{
					kind: 'classification',
					slug: 'brand',
				},
			],
		},
		{
			subjectClassification: 'company',
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
			subjectClassification: 'company',
			predicate: {
				key: 'sponsoredBy',
				id: '0x80d43f1c53058ddeba0daea68c239900133bc08ff1dec845c424190ff36c5f9e',
				label: 'sponsored by',
				description:
					'The subject event, project, or initiative receives financial sponsorship from the object entity',
				status: 'proposed',
				category: 'Economic/Market',
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
			subjectClassification: 'company',
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
			subjectClassification: 'company',
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
	availableFieldCount: 89,
} as const satisfies CreationProfile;

export const creationProfile = companyCreationProfile;
export default companyCreationProfile;
