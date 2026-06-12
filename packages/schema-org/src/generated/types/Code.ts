import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgCode = {
	id: 'schema:Code',
	name: 'Code',
	label: 'Code',
	comment:
		'Computer programming source code. Example: Full (compile ready) solutions, code snippet samples, scripts, templates.',
	subClassOf: ['CreativeWork', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgCode;
export const Code = schemaOrgCode;

export default schemaOrgCode;
