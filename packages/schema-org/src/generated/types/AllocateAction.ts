import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgAllocateAction = {
	id: 'schema:AllocateAction',
	name: 'AllocateAction',
	label: 'AllocateAction',
	comment: 'The act of organizing tasks/objects/events by associating resources to it.',
	subClassOf: ['OrganizeAction', 'Action', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgAllocateAction;
export const AllocateAction = schemaOrgAllocateAction;

export default schemaOrgAllocateAction;
