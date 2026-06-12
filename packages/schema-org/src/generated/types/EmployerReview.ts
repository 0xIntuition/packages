import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgEmployerReview = {
	id: 'schema:EmployerReview',
	name: 'EmployerReview',
	label: 'EmployerReview',
	comment:
		'An [[EmployerReview]] is a review of an [[Organization]] regarding its role as an employer, written by a current or former employee of that organization.',
	subClassOf: ['Review', 'CreativeWork', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgEmployerReview;
export const EmployerReview = schemaOrgEmployerReview;

export default schemaOrgEmployerReview;
