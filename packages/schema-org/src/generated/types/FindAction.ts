import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgFindAction = {
	id: 'schema:FindAction',
	name: 'FindAction',
	label: 'FindAction',
	comment:
		'The act of finding an object.\\n\\nRelated actions:\\n\\n* [[SearchAction]]: FindAction is generally lead by a SearchAction, but not necessarily.',
	subClassOf: ['Action', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgFindAction;
export const FindAction = schemaOrgFindAction;

export default schemaOrgFindAction;
