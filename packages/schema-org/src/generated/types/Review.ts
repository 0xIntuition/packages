import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgReview = {
	id: 'schema:Review',
	name: 'Review',
	label: 'Review',
	comment: 'A review of an item - for example, of a restaurant, movie, or store.',
	subClassOf: ['CreativeWork', 'Thing'],
	properties: [
		{
			id: 'schema:associatedClaimReview',
			name: 'associatedClaimReview',
			label: 'associatedClaimReview',
			comment:
				'An associated [[ClaimReview]], related by specific common content, topic or claim. The expectation is that this property would be most typically used in cases where a single activity is conducting both claim reviews and media reviews, in which case [[relatedMediaReview]] would commonly be used on a [[ClaimReview]], while [[associatedClaimReview]] would be used on [[MediaReview]].',
			rangeIncludes: ['Review'],
		},
		{
			id: 'schema:associatedMediaReview',
			name: 'associatedMediaReview',
			label: 'associatedMediaReview',
			comment:
				'An associated [[MediaReview]], related by specific common content, topic or claim. The expectation is that this property would be most typically used in cases where a single activity is conducting both claim reviews and media reviews, in which case [[relatedMediaReview]] would commonly be used on a [[ClaimReview]], while [[associatedClaimReview]] would be used on [[MediaReview]].',
			rangeIncludes: ['Review'],
		},
		{
			id: 'schema:associatedReview',
			name: 'associatedReview',
			label: 'associatedReview',
			comment: 'An associated [[Review]].',
			rangeIncludes: ['Review'],
		},
		{
			id: 'schema:itemReviewed',
			name: 'itemReviewed',
			label: 'itemReviewed',
			comment: 'The item that is being reviewed/rated.',
			rangeIncludes: ['Thing'],
		},
		{
			id: 'schema:negativeNotes',
			name: 'negativeNotes',
			label: 'negativeNotes',
			comment:
				'Provides negative considerations regarding something, most typically in pro/con lists for reviews (alongside [[positiveNotes]]). For symmetry \n\nIn the case of a [[Review]], the property describes the [[itemReviewed]] from the perspective of the review; in the case of a [[Product]], the product itself is being described. Since product descriptions \ntend to emphasise positive claims, it may be relatively unusual to find [[negativeNotes]] used in this way. Nevertheless for the sake of symmetry, [[negativeNotes]] can be used on [[Product]].\n\nThe property values can be expressed either as unstructured text (repeated as necessary), or if ordered, as a list (in which case the most negative is at the beginning of the list).',
			rangeIncludes: ['ItemList', 'ListItem', 'Text', 'WebContent'],
		},
		{
			id: 'schema:positiveNotes',
			name: 'positiveNotes',
			label: 'positiveNotes',
			comment:
				'Provides positive considerations regarding something, for example product highlights or (alongside [[negativeNotes]]) pro/con lists for reviews.\n\nIn the case of a [[Review]], the property describes the [[itemReviewed]] from the perspective of the review; in the case of a [[Product]], the product itself is being described.\n\nThe property values can be expressed either as unstructured text (repeated as necessary), or if ordered, as a list (in which case the most positive is at the beginning of the list).',
			rangeIncludes: ['ItemList', 'ListItem', 'Text', 'WebContent'],
		},
		{
			id: 'schema:reviewAspect',
			name: 'reviewAspect',
			label: 'reviewAspect',
			comment: 'This Review or Rating is relevant to this part or facet of the itemReviewed.',
			rangeIncludes: ['StructuredValue', 'Text'],
		},
		{
			id: 'schema:reviewBody',
			name: 'reviewBody',
			label: 'reviewBody',
			comment: 'The actual body of the review.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:reviewRating',
			name: 'reviewRating',
			label: 'reviewRating',
			comment:
				'The rating given in this review. Note that reviews can themselves be rated. The ```reviewRating``` applies to rating given by the review. The [[aggregateRating]] property applies to the review itself, as a creative work.',
			rangeIncludes: ['Rating'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgReview;
export const Review = schemaOrgReview;

export default schemaOrgReview;
