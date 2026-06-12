import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMediaReviewItem = {
	id: 'schema:MediaReviewItem',
	name: 'MediaReviewItem',
	label: 'MediaReviewItem',
	comment:
		'Represents an item or group of closely related items treated as a unit for the sake of evaluation in a [[MediaReview]]. Authorship etc. apply to the items rather than to the curation/grouping or reviewing party.',
	subClassOf: ['CreativeWork', 'Thing'],
	properties: [
		{
			id: 'schema:mediaItemAppearance',
			name: 'mediaItemAppearance',
			label: 'mediaItemAppearance',
			comment:
				'In the context of a [[MediaReview]], indicates specific media item(s) that are grouped using a [[MediaReviewItem]].',
			rangeIncludes: ['MediaObject'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgMediaReviewItem;
export const MediaReviewItem = schemaOrgMediaReviewItem;

export default schemaOrgMediaReviewItem;
