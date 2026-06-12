import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgDeleteAction = {
	id: 'schema:DeleteAction',
	name: 'DeleteAction',
	label: 'DeleteAction',
	comment: 'The act of editing a recipient by removing one of its objects.',
	subClassOf: ['UpdateAction', 'Action', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgDeleteAction;
export const DeleteAction = schemaOrgDeleteAction;

export default schemaOrgDeleteAction;
