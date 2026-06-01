import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgReplyAction = {
	id: 'schema:ReplyAction',
	name: 'ReplyAction',
	label: 'ReplyAction',
	comment:
		'The act of responding to a question/message asked/sent by the object. Related to [[AskAction]].\\n\\nRelated actions:\\n\\n* [[AskAction]]: Appears generally as an origin of a ReplyAction.',
	subClassOf: ['CommunicateAction', 'InteractAction', 'Action', 'Thing'],
	properties: [
		{
			id: 'schema:resultComment',
			name: 'resultComment',
			label: 'resultComment',
			comment: 'A sub property of result. The Comment created or sent as a result of this action.',
			rangeIncludes: ['Comment'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgReplyAction;
export const ReplyAction = schemaOrgReplyAction;

export default schemaOrgReplyAction;
