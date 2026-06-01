import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgFloat = {
	id: 'schema:Float',
	name: 'Float',
	label: 'Float',
	comment: 'Data type: Floating number.',
	subClassOf: ['Number'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgFloat;
export const Float = schemaOrgFloat;

export default schemaOrgFloat;
