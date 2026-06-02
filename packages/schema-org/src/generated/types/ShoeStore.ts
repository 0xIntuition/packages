import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgShoeStore = {
	id: 'schema:ShoeStore',
	name: 'ShoeStore',
	label: 'ShoeStore',
	comment: 'A shoe store.',
	subClassOf: ['Store', 'LocalBusiness', 'Organization', 'Place', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgShoeStore;
export const ShoeStore = schemaOrgShoeStore;

export default schemaOrgShoeStore;
