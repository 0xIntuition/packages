import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgBrand = {
	id: 'schema:Brand',
	name: 'Brand',
	label: 'Brand',
	comment:
		'A brand is a name used by an organization or business person for labeling a product, product group, or similar.',
	subClassOf: ['Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:aggregateRating',
			name: 'aggregateRating',
			label: 'aggregateRating',
			comment: 'The overall rating, based on a collection of reviews or ratings, of the item.',
			rangeIncludes: ['AggregateRating'],
		},
		{
			id: 'schema:logo',
			name: 'logo',
			label: 'logo',
			comment: 'An associated logo.',
			rangeIncludes: ['ImageObject', 'URL'],
		},
		{
			id: 'schema:review',
			name: 'review',
			label: 'review',
			comment: 'A review of the item.',
			rangeIncludes: ['Review'],
		},
		{
			id: 'schema:slogan',
			name: 'slogan',
			label: 'slogan',
			comment: 'A slogan or motto associated with the item.',
			rangeIncludes: ['Text'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgBrand;
export const Brand = schemaOrgBrand;

export default schemaOrgBrand;
