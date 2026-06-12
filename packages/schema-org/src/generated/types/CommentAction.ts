import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgCommentAction = {
	id: 'schema:CommentAction',
	name: 'CommentAction',
	label: 'CommentAction',
	comment: 'The act of generating a comment about a subject.',
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

export const spec = schemaOrgCommentAction;
export const CommentAction = schemaOrgCommentAction;

export default schemaOrgCommentAction;
