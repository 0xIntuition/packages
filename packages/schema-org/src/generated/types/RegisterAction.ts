import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgRegisterAction = {
	id: 'schema:RegisterAction',
	name: 'RegisterAction',
	label: 'RegisterAction',
	comment:
		"The act of registering to be a user of a service, product or web page.\\n\\nRelated actions:\\n\\n* [[JoinAction]]: Unlike JoinAction, RegisterAction implies you are registering to be a user of a service, *not* a group/team of people.\\n* [[FollowAction]]: Unlike FollowAction, RegisterAction doesn't imply that the agent is expecting to poll for updates from the object.\\n* [[SubscribeAction]]: Unlike SubscribeAction, RegisterAction doesn't imply that the agent is expecting updates from the object.",
	subClassOf: ['InteractAction', 'Action', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgRegisterAction;
export const RegisterAction = schemaOrgRegisterAction;

export default schemaOrgRegisterAction;
