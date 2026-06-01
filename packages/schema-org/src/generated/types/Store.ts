import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgStore = {
	id: 'schema:Store',
	name: 'Store',
	label: 'Store',
	comment: 'A retail good store.',
	subClassOf: ['LocalBusiness', 'Organization', 'Thing', 'Place'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgStore;
export const Store = schemaOrgStore;

export default schemaOrgStore;
