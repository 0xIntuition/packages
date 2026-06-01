import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgBoolean = {
	id: 'schema:Boolean',
	name: 'Boolean',
	label: 'Boolean',
	comment: 'Boolean: True or False.',
	subClassOf: [],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgBoolean;

export default schemaOrgBoolean;
