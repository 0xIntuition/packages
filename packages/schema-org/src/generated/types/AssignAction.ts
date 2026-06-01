import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgAssignAction = {
	id: 'schema:AssignAction',
	name: 'AssignAction',
	label: 'AssignAction',
	comment: 'The act of allocating an action/event/task to some destination (someone or something).',
	subClassOf: ['AllocateAction', 'OrganizeAction', 'Action', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgAssignAction;
export const AssignAction = schemaOrgAssignAction;

export default schemaOrgAssignAction;
