import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgRsvpAction = {
	id: 'schema:RsvpAction',
	name: 'RsvpAction',
	label: 'RsvpAction',
	comment: 'The act of notifying an event organizer as to whether you expect to attend the event.',
	subClassOf: ['InformAction', 'CommunicateAction', 'InteractAction', 'Action', 'Thing'],
	properties: [
		{
			id: 'schema:additionalNumberOfGuests',
			name: 'additionalNumberOfGuests',
			label: 'additionalNumberOfGuests',
			comment:
				'If responding yes, the number of guests who will attend in addition to the invitee.',
			rangeIncludes: ['Number'],
		},
		{
			id: 'schema:comment',
			name: 'comment',
			label: 'comment',
			comment: 'Comments, typically from users.',
			rangeIncludes: ['Comment'],
		},
		{
			id: 'schema:rsvpResponse',
			name: 'rsvpResponse',
			label: 'rsvpResponse',
			comment: 'The response (yes, no, maybe) to the RSVP.',
			rangeIncludes: ['RsvpResponseType'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgRsvpAction;
export const RsvpAction = schemaOrgRsvpAction;

export default schemaOrgRsvpAction;
