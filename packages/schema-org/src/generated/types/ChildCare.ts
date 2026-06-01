import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgChildCare = {
	id: 'schema:ChildCare',
	name: 'ChildCare',
	label: 'ChildCare',
	comment: 'A Childcare center.',
	subClassOf: ['LocalBusiness', 'Organization', 'Thing', 'Place'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgChildCare;
export const ChildCare = schemaOrgChildCare;

export default schemaOrgChildCare;
