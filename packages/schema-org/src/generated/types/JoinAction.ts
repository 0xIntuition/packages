import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgJoinAction = {
	id: 'schema:JoinAction',
	name: 'JoinAction',
	label: 'JoinAction',
	comment:
		"An agent joins an event/group with participants/friends at a location.\\n\\nRelated actions:\\n\\n* [[RegisterAction]]: Unlike RegisterAction, JoinAction refers to joining a group/team of people.\\n* [[SubscribeAction]]: Unlike SubscribeAction, JoinAction does not imply that you'll be receiving updates.\\n* [[FollowAction]]: Unlike FollowAction, JoinAction does not imply that you'll be polling for updates.",
	subClassOf: ['InteractAction', 'Action', 'Thing'],
	properties: [
		{
			id: 'schema:event',
			name: 'event',
			label: 'event',
			comment: 'Upcoming or past event associated with this place, organization, or action.',
			rangeIncludes: ['Event'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgJoinAction;
export const JoinAction = schemaOrgJoinAction;

export default schemaOrgJoinAction;
