import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgConfirmAction = {
	id: 'schema:ConfirmAction',
	name: 'ConfirmAction',
	label: 'ConfirmAction',
	comment:
		'The act of notifying someone that a future event/action is going to happen as expected.\\n\\nRelated actions:\\n\\n* [[CancelAction]]: The antonym of ConfirmAction.',
	subClassOf: ['InformAction', 'CommunicateAction', 'InteractAction', 'Action', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgConfirmAction;
export const ConfirmAction = schemaOrgConfirmAction;

export default schemaOrgConfirmAction;
