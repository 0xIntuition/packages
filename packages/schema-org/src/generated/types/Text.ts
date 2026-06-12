import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgText = {
	id: 'schema:Text',
	name: 'Text',
	label: 'Text',
	comment: 'Data type: Text.',
	subClassOf: [],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgText;
export const Text = schemaOrgText;

export default schemaOrgText;
