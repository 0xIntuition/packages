import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgSolveMathAction = {
	id: 'schema:SolveMathAction',
	name: 'SolveMathAction',
	label: 'SolveMathAction',
	comment:
		'The action that takes in a math expression and directs users to a page potentially capable of solving/simplifying that expression.',
	subClassOf: ['Action', 'Thing'],
	properties: [
		{
			id: 'schema:eduQuestionType',
			name: 'eduQuestionType',
			label: 'eduQuestionType',
			comment:
				'For questions that are part of learning resources (e.g. Quiz), eduQuestionType indicates the format of question being given. Example: "Multiple choice", "Open ended", "Flashcard".',
			rangeIncludes: ['Text'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgSolveMathAction;
export const SolveMathAction = schemaOrgSolveMathAction;

export default schemaOrgSolveMathAction;
