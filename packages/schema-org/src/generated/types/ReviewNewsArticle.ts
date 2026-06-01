import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgReviewNewsArticle = {
	id: 'schema:ReviewNewsArticle',
	name: 'ReviewNewsArticle',
	label: 'ReviewNewsArticle',
	comment:
		"A [[NewsArticle]] and [[CriticReview]] providing a professional critic's assessment of a service, product, performance, or artistic or literary work.",
	subClassOf: ['CriticReview', 'Review', 'CreativeWork', 'Thing', 'NewsArticle', 'Article'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgReviewNewsArticle;
export const ReviewNewsArticle = schemaOrgReviewNewsArticle;

export default schemaOrgReviewNewsArticle;
