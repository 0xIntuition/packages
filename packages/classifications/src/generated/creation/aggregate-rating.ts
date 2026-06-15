import type { CreationProfile } from '../../creation-profile.js';

export const aggregateRatingCreationProfile = {
	classification: {
		slug: 'aggregate-rating',
		type: 'AggregateRating',
		displayName: 'Aggregate Rating',
		description: 'A stable aggregate rating summary for a reviewed thing.',
		category: 'Product',
		schema: {
			context: 'https://schema.org/',
			type: 'AggregateRating',
		},
	},
	fields: [
		{
			key: 'ratingValue',
			label: 'Rating Value',
			description: 'The aggregate average rating.',
			fieldType: 'number',
			required: true,
			placeholder: '4.7',
			schemaProperty: 'ratingValue',
			schema: {
				context: 'https://schema.org/',
				property: 'ratingValue',
				propertyId: 'schema:ratingValue',
				label: 'ratingValue',
				comment:
					"The rating for the content.\\n\\nUsage guidelines:\\n\\n* Use values from 0123456789 (Unicode 'DIGIT ZERO' (U+0030) to 'DIGIT NINE' (U+0039)) rather than superficially similar Unicode symbols.\\n* Use '.' (Unicode 'FULL STOP' (U+002E)) rather than ',' to indicate a decimal point. Avoid using these symbols as a readability separator.",
				originType: 'Rating',
				originTypeId: 'schema:Rating',
				rangeIncludes: ['Number', 'Text'],
			},
		},
		{
			key: 'reviewCount',
			label: 'Review Count',
			description: 'The number of reviews represented by the aggregate.',
			fieldType: 'integer',
			required: true,
			placeholder: '1320',
			schemaProperty: 'reviewCount',
			schema: {
				context: 'https://schema.org/',
				property: 'reviewCount',
				propertyId: 'schema:reviewCount',
				label: 'reviewCount',
				comment: 'The count of total number of reviews.',
				originType: 'AggregateRating',
				originTypeId: 'schema:AggregateRating',
				rangeIncludes: ['Integer'],
			},
		},
		{
			key: 'bestRating',
			label: 'Best Rating',
			description: 'The upper bound of the rating scale when needed.',
			fieldType: 'number',
			required: false,
			placeholder: '5',
			schemaProperty: 'bestRating',
			schema: {
				context: 'https://schema.org/',
				property: 'bestRating',
				propertyId: 'schema:bestRating',
				label: 'bestRating',
				comment: 'The highest value allowed in this rating system.',
				originType: 'Rating',
				originTypeId: 'schema:Rating',
				rangeIncludes: ['Number', 'Text'],
			},
		},
		{
			key: 'worstRating',
			label: 'Worst Rating',
			description: 'The lower bound of the rating scale when needed.',
			fieldType: 'number',
			required: false,
			placeholder: '1',
			schemaProperty: 'worstRating',
			schema: {
				context: 'https://schema.org/',
				property: 'worstRating',
				propertyId: 'schema:worstRating',
				label: 'worstRating',
				comment: 'The lowest value allowed in this rating system.',
				originType: 'Rating',
				originTypeId: 'schema:Rating',
				rangeIncludes: ['Number', 'Text'],
			},
		},
	],
	relationships: [
		{
			subjectClassification: 'aggregate-rating',
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
			subjectClassification: 'aggregate-rating',
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
	],
	availableFieldCount: 22,
} as const satisfies CreationProfile;

export const creationProfile = aggregateRatingCreationProfile;
export default aggregateRatingCreationProfile;
