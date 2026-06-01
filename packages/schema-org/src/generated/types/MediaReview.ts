import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMediaReview = {
	id: 'schema:MediaReview',
	name: 'MediaReview',
	label: 'MediaReview',
	comment:
		'A [[MediaReview]] is a more specialized form of Review dedicated to the evaluation of media content online, typically in the context of fact-checking and misinformation.\n    For more general reviews of media in the broader sense, use [[UserReview]], [[CriticReview]] or other [[Review]] types. This definition is\n    a work in progress. While the [[MediaManipulationRatingEnumeration]] list reflects significant community review amongst fact-checkers and others working\n    to combat misinformation, the specific structures for representing media objects, their versions and publication context, are still evolving. Similarly, best practices for the relationship between [[MediaReview]] and [[ClaimReview]] markup have not yet been finalized.',
	subClassOf: ['Review', 'CreativeWork', 'Thing'],
	properties: [
		{
			id: 'schema:mediaAuthenticityCategory',
			name: 'mediaAuthenticityCategory',
			label: 'mediaAuthenticityCategory',
			comment:
				'Indicates a MediaManipulationRatingEnumeration classification of a media object (in the context of how it was published or shared).',
			rangeIncludes: ['MediaManipulationRatingEnumeration'],
		},
		{
			id: 'schema:originalMediaContextDescription',
			name: 'originalMediaContextDescription',
			label: 'originalMediaContextDescription',
			comment:
				'Describes, in a [[MediaReview]] when dealing with [[DecontextualizedContent]], background information that can contribute to better interpretation of the [[MediaObject]].',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:originalMediaLink',
			name: 'originalMediaLink',
			label: 'originalMediaLink',
			comment:
				'Link to the page containing an original version of the content, or directly to an online copy of the original [[MediaObject]] content, e.g. video file.',
			rangeIncludes: ['MediaObject', 'URL', 'WebPage'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgMediaReview;
export const MediaReview = schemaOrgMediaReview;

export default schemaOrgMediaReview;
