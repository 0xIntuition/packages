import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgReviewAction = {
	id: 'schema:ReviewAction',
	name: 'ReviewAction',
	label: 'ReviewAction',
	comment:
		'The act of producing a balanced opinion about the object for an audience. An agent reviews an object with participants resulting in a review.',
	subClassOf: ['AssessAction', 'Action', 'Thing'],
	properties: [
		{
			id: 'schema:resultReview',
			name: 'resultReview',
			label: 'resultReview',
			comment:
				'A sub property of result. The review that resulted in the performing of the action.',
			rangeIncludes: ['Review'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgReviewAction;
export const ReviewAction = schemaOrgReviewAction;

export default schemaOrgReviewAction;
