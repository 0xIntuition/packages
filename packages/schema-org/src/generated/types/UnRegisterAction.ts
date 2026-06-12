import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgUnRegisterAction = {
	id: 'schema:UnRegisterAction',
	name: 'UnRegisterAction',
	label: 'UnRegisterAction',
	comment:
		'The act of un-registering from a service.\\n\\nRelated actions:\\n\\n* [[RegisterAction]]: antonym of UnRegisterAction.\\n* [[LeaveAction]]: Unlike LeaveAction, UnRegisterAction implies that you are unregistering from a service you were previously registered, rather than leaving a team/group of people.',
	subClassOf: ['InteractAction', 'Action', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgUnRegisterAction;
export const UnRegisterAction = schemaOrgUnRegisterAction;

export default schemaOrgUnRegisterAction;
