import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgAskAction = {
	id: 'schema:AskAction',
	name: 'AskAction',
	label: 'AskAction',
	comment:
		'The act of posing a question / favor to someone.\\n\\nRelated actions:\\n\\n* [[ReplyAction]]: Appears generally as a response to AskAction.',
	subClassOf: ['CommunicateAction', 'InteractAction', 'Action', 'Thing'],
	properties: [
		{
			id: 'schema:question',
			name: 'question',
			label: 'question',
			comment: 'A sub property of object. A question.',
			rangeIncludes: ['Question'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgAskAction;
export const AskAction = schemaOrgAskAction;

export default schemaOrgAskAction;
