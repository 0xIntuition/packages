import type { CreationProfile } from '../../creation-profile.js';

export const reviewCreationProfile = {
	classification: {
		slug: 'review',
		type: 'Review',
		displayName: 'Review',
		description: 'A review identity linked to a durable target reference.',
		category: 'Creative Work',
		schema: {
			context: 'https://schema.org/',
			type: 'Review',
		},
	},
	fields: [
		{
			key: 'name',
			label: 'Review Title',
			description: 'The review title when needed.',
			fieldType: 'string',
			required: false,
			placeholder: 'Great wallet UX',
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
			key: 'reviewBody',
			label: 'Review Text',
			description: 'The main review text.',
			fieldType: 'string',
			required: true,
			placeholder: 'Very smooth onboarding and transaction flow.',
			schemaProperty: 'reviewBody',
			schema: {
				context: 'https://schema.org/',
				property: 'reviewBody',
				propertyId: 'schema:reviewBody',
				label: 'reviewBody',
				comment: 'The actual body of the review.',
				originType: 'Review',
				originTypeId: 'schema:Review',
				rangeIncludes: ['Text'],
			},
		},
		{
			key: 'itemReviewed',
			label: 'Reviewed Item',
			description: 'The identifier or URL of the item being reviewed.',
			fieldType: 'string',
			required: false,
			placeholder: 'https://example.com/products/wallet',
			schemaProperty: 'itemReviewed',
			schema: {
				context: 'https://schema.org/',
				property: 'itemReviewed',
				propertyId: 'schema:itemReviewed',
				label: 'itemReviewed',
				comment: 'The item that is being reviewed/rated.',
				originType: 'Review',
				originTypeId: 'schema:Review',
				rangeIncludes: ['Thing'],
			},
		},
		{
			key: 'sameAs',
			label: 'Canonical References',
			description: 'Canonical URLs for the same review.',
			fieldType: 'string[]',
			required: false,
			placeholder: 'https://example.com/reviews/wallet-123',
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
			subjectClassification: 'review',
			predicate: {
				key: 'itemReviewed',
				id: '0x483aae34762186dd047937e9571b79f01378d9ace06c5a79ce4a31708c9546c6',
				label: 'item reviewed',
				description: 'The subject review or aggregate rating evaluates the object item',
				status: 'proposed',
				category: 'Social/Reputation',
				marketPattern: 'attributive',
			},
			expectedObjects: [
				{
					kind: 'any',
					reason:
						'Reviews and ratings can target products, media, services, organizations, or other atom classifications.',
				},
			],
		},
		{
			subjectClassification: 'review',
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
			subjectClassification: 'review',
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

export const creationProfile = reviewCreationProfile;
export default reviewCreationProfile;
