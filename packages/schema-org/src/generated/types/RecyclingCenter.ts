import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgRecyclingCenter = {
	id: 'schema:RecyclingCenter',
	name: 'RecyclingCenter',
	label: 'RecyclingCenter',
	comment: 'A recycling center.',
	subClassOf: ['LocalBusiness', 'Organization', 'Thing', 'Place'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgRecyclingCenter;
export const RecyclingCenter = schemaOrgRecyclingCenter;

export default schemaOrgRecyclingCenter;
