import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgInteger = {
	id: 'schema:Integer',
	name: 'Integer',
	label: 'Integer',
	comment: 'Data type: Integer.',
	subClassOf: ['Number'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgInteger;
export const Integer = schemaOrgInteger;

export default schemaOrgInteger;
