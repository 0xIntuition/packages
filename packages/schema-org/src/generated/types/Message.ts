import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgMessage = {
	id: 'schema:Message',
	name: 'Message',
	label: 'Message',
	comment: 'A single message from a sender to one or more organizations or people.',
	subClassOf: ['CreativeWork', 'Thing'],
	properties: [
		{
			id: 'schema:bccRecipient',
			name: 'bccRecipient',
			label: 'bccRecipient',
			comment: 'A sub property of recipient. The recipient blind copied on a message.',
			rangeIncludes: ['ContactPoint', 'Organization', 'Person'],
		},
		{
			id: 'schema:ccRecipient',
			name: 'ccRecipient',
			label: 'ccRecipient',
			comment: 'A sub property of recipient. The recipient copied on a message.',
			rangeIncludes: ['ContactPoint', 'Organization', 'Person'],
		},
		{
			id: 'schema:dateRead',
			name: 'dateRead',
			label: 'dateRead',
			comment:
				'The date/time at which the message has been read by the recipient if a single recipient exists.',
			rangeIncludes: ['Date', 'DateTime'],
		},
		{
			id: 'schema:dateReceived',
			name: 'dateReceived',
			label: 'dateReceived',
			comment: 'The date/time the message was received if a single recipient exists.',
			rangeIncludes: ['DateTime'],
		},
		{
			id: 'schema:dateSent',
			name: 'dateSent',
			label: 'dateSent',
			comment: 'The date/time at which the message was sent.',
			rangeIncludes: ['DateTime'],
		},
		{
			id: 'schema:messageAttachment',
			name: 'messageAttachment',
			label: 'messageAttachment',
			comment: 'A CreativeWork attached to the message.',
			rangeIncludes: ['CreativeWork'],
		},
		{
			id: 'schema:recipient',
			name: 'recipient',
			label: 'recipient',
			comment:
				'A sub property of participant. The participant who is at the receiving end of the action.',
			rangeIncludes: ['Audience', 'ContactPoint', 'Organization', 'Person'],
		},
		{
			id: 'schema:sender',
			name: 'sender',
			label: 'sender',
			comment:
				'A sub property of participant. The participant who is at the sending end of the action.',
			rangeIncludes: ['Audience', 'Organization', 'Person'],
		},
		{
			id: 'schema:toRecipient',
			name: 'toRecipient',
			label: 'toRecipient',
			comment: 'A sub property of recipient. The recipient who was directly sent the message.',
			rangeIncludes: ['Audience', 'ContactPoint', 'Organization', 'Person'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgMessage;
export const Message = schemaOrgMessage;

export default schemaOrgMessage;
