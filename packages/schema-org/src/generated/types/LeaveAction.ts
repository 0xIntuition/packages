import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgLeaveAction = {
	id: 'schema:LeaveAction',
	name: 'LeaveAction',
	label: 'LeaveAction',
	comment:
		'An agent leaves an event / group with participants/friends at a location.\\n\\nRelated actions:\\n\\n* [[JoinAction]]: The antonym of LeaveAction.\\n* [[UnRegisterAction]]: Unlike UnRegisterAction, LeaveAction implies leaving a group/team of people rather than a service.',
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

export const spec = schemaOrgLeaveAction;
export const LeaveAction = schemaOrgLeaveAction;

export default schemaOrgLeaveAction;
