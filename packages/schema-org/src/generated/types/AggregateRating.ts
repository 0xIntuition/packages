import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgAggregateRating = {
	id: 'schema:AggregateRating',
	name: 'AggregateRating',
	label: 'AggregateRating',
	comment: 'The average rating based on multiple ratings or reviews.',
	subClassOf: ['Rating', 'Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:itemReviewed',
			name: 'itemReviewed',
			label: 'itemReviewed',
			comment: 'The item that is being reviewed/rated.',
			rangeIncludes: ['Thing'],
		},
		{
			id: 'schema:ratingCount',
			name: 'ratingCount',
			label: 'ratingCount',
			comment: 'The count of total number of ratings.',
			rangeIncludes: ['Integer'],
		},
		{
			id: 'schema:reviewCount',
			name: 'reviewCount',
			label: 'reviewCount',
			comment: 'The count of total number of reviews.',
			rangeIncludes: ['Integer'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgAggregateRating;
export const AggregateRating = schemaOrgAggregateRating;

export default schemaOrgAggregateRating;
