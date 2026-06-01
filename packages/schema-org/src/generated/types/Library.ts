import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgLibrary = {
	id: 'schema:Library',
	name: 'Library',
	label: 'Library',
	comment: 'A library.',
	subClassOf: ['LocalBusiness', 'Organization', 'Thing', 'Place'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgLibrary;
export const Library = schemaOrgLibrary;

export default schemaOrgLibrary;
