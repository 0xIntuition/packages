import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgBookStore = {
	id: 'schema:BookStore',
	name: 'BookStore',
	label: 'BookStore',
	comment: 'A bookstore.',
	subClassOf: ['Store', 'LocalBusiness', 'Organization', 'Thing', 'Place'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgBookStore;
export const BookStore = schemaOrgBookStore;

export default schemaOrgBookStore;
