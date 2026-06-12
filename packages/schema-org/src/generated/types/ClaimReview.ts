import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgClaimReview = {
	id: 'schema:ClaimReview',
	name: 'ClaimReview',
	label: 'ClaimReview',
	comment:
		'A fact-checking review of claims made (or reported) in some creative work (referenced via itemReviewed).',
	subClassOf: ['Review', 'CreativeWork', 'Thing'],
	properties: [
		{
			id: 'schema:claimReviewed',
			name: 'claimReviewed',
			label: 'claimReviewed',
			comment: 'A short summary of the specific claims reviewed in a ClaimReview.',
			rangeIncludes: ['Text'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgClaimReview;
export const ClaimReview = schemaOrgClaimReview;

export default schemaOrgClaimReview;
