import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgTable = {
	id: 'schema:Table',
	name: 'Table',
	label: 'Table',
	comment: 'A table on a Web page.',
	subClassOf: ['WebPageElement', 'CreativeWork', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgTable;
export const Table = schemaOrgTable;

export default schemaOrgTable;
