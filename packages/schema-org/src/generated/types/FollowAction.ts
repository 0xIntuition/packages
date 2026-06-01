import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgFollowAction = {
	id: 'schema:FollowAction',
	name: 'FollowAction',
	label: 'FollowAction',
	comment:
		"The act of forming a personal connection with someone/something (object) unidirectionally/asymmetrically to get updates polled from.\\n\\nRelated actions:\\n\\n* [[BefriendAction]]: Unlike BefriendAction, FollowAction implies that the connection is *not* necessarily reciprocal.\\n* [[SubscribeAction]]: Unlike SubscribeAction, FollowAction implies that the follower acts as an active agent constantly/actively polling for updates.\\n* [[RegisterAction]]: Unlike RegisterAction, FollowAction implies that the agent is interested in continuing receiving updates from the object.\\n* [[JoinAction]]: Unlike JoinAction, FollowAction implies that the agent is interested in getting updates from the object.\\n* [[TrackAction]]: Unlike TrackAction, FollowAction refers to the polling of updates of all aspects of animate objects rather than the location of inanimate objects (e.g. you track a package, but you don't follow it).",
	subClassOf: ['InteractAction', 'Action', 'Thing'],
	properties: [
		{
			id: 'schema:followee',
			name: 'followee',
			label: 'followee',
			comment: 'A sub property of object. The person or organization being followed.',
			rangeIncludes: ['Organization', 'Person'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgFollowAction;
export const FollowAction = schemaOrgFollowAction;

export default schemaOrgFollowAction;
