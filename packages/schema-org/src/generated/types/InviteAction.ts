import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgInviteAction = {
	id: 'schema:InviteAction',
	name: 'InviteAction',
	label: 'InviteAction',
	comment: 'The act of asking someone to attend an event. Reciprocal of RsvpAction.',
	subClassOf: ['CommunicateAction', 'InteractAction', 'Action', 'Thing'],
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

export const spec = schemaOrgInviteAction;
export const InviteAction = schemaOrgInviteAction;

export default schemaOrgInviteAction;
