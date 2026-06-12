import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgUserReview = {
	id: 'schema:UserReview',
	name: 'UserReview',
	label: 'UserReview',
	comment:
		'A review created by an end-user (e.g. consumer, purchaser, attendee etc.), in contrast with [[CriticReview]].',
	subClassOf: ['Review', 'CreativeWork', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgUserReview;
export const UserReview = schemaOrgUserReview;

export default schemaOrgUserReview;
