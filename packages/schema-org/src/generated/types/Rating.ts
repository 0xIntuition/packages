import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgRating = {
	id: 'schema:Rating',
	name: 'Rating',
	label: 'Rating',
	comment: 'A rating is an evaluation on a numeric scale, such as 1 to 5 stars.',
	subClassOf: ['Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:author',
			name: 'author',
			label: 'author',
			comment:
				'The author of this content or rating. Please note that author is special in that HTML 5 provides a special mechanism for indicating authorship via the rel tag. That is equivalent to this and may be used interchangeably.',
			rangeIncludes: ['Organization', 'Person'],
		},
		{
			id: 'schema:bestRating',
			name: 'bestRating',
			label: 'bestRating',
			comment: 'The highest value allowed in this rating system.',
			rangeIncludes: ['Number', 'Text'],
		},
		{
			id: 'schema:ratingExplanation',
			name: 'ratingExplanation',
			label: 'ratingExplanation',
			comment:
				'A short explanation (e.g. one to two sentences) providing background context and other information that led to the conclusion expressed in the rating. This is particularly applicable to ratings associated with "fact check" markup using [[ClaimReview]].',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:ratingValue',
			name: 'ratingValue',
			label: 'ratingValue',
			comment:
				"The rating for the content.\\n\\nUsage guidelines:\\n\\n* Use values from 0123456789 (Unicode 'DIGIT ZERO' (U+0030) to 'DIGIT NINE' (U+0039)) rather than superficially similar Unicode symbols.\\n* Use '.' (Unicode 'FULL STOP' (U+002E)) rather than ',' to indicate a decimal point. Avoid using these symbols as a readability separator.",
			rangeIncludes: ['Number', 'Text'],
		},
		{
			id: 'schema:reviewAspect',
			name: 'reviewAspect',
			label: 'reviewAspect',
			comment: 'This Review or Rating is relevant to this part or facet of the itemReviewed.',
			rangeIncludes: ['StructuredValue', 'Text'],
		},
		{
			id: 'schema:worstRating',
			name: 'worstRating',
			label: 'worstRating',
			comment: 'The lowest value allowed in this rating system.',
			rangeIncludes: ['Number', 'Text'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgRating;
export const Rating = schemaOrgRating;

export default schemaOrgRating;
