import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgCancelAction = {
	id: 'schema:CancelAction',
	name: 'CancelAction',
	label: 'CancelAction',
	comment:
		'The act of asserting that a future event/action is no longer going to happen.\\n\\nRelated actions:\\n\\n* [[ConfirmAction]]: The antonym of CancelAction.',
	subClassOf: ['PlanAction', 'OrganizeAction', 'Action', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgCancelAction;
export const CancelAction = schemaOrgCancelAction;

export default schemaOrgCancelAction;
