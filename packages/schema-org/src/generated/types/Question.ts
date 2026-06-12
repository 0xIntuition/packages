import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgQuestion = {
	id: 'schema:Question',
	name: 'Question',
	label: 'Question',
	comment:
		'A specific question - e.g. from a user seeking answers online, or collected in a Frequently Asked Questions (FAQ) document.',
	subClassOf: ['Comment', 'CreativeWork', 'Thing'],
	properties: [
		{
			id: 'schema:acceptedAnswer',
			name: 'acceptedAnswer',
			label: 'acceptedAnswer',
			comment:
				'The answer(s) that has been accepted as best, typically on a Question/Answer site. Sites vary in their selection mechanisms, e.g. drawing on community opinion and/or the view of the Question author.',
			rangeIncludes: ['Answer', 'ItemList'],
		},
		{
			id: 'schema:answerCount',
			name: 'answerCount',
			label: 'answerCount',
			comment: 'The number of answers this question has received.',
			rangeIncludes: ['Integer'],
		},
		{
			id: 'schema:eduQuestionType',
			name: 'eduQuestionType',
			label: 'eduQuestionType',
			comment:
				'For questions that are part of learning resources (e.g. Quiz), eduQuestionType indicates the format of question being given. Example: "Multiple choice", "Open ended", "Flashcard".',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:parentItem',
			name: 'parentItem',
			label: 'parentItem',
			comment:
				'The parent of a question, answer or item in general. Typically used for Q/A discussion threads e.g. a chain of comments with the first comment being an [[Article]] or other [[CreativeWork]]. See also [[comment]] which points from something to a comment about it.',
			rangeIncludes: ['Comment', 'CreativeWork'],
		},
		{
			id: 'schema:suggestedAnswer',
			name: 'suggestedAnswer',
			label: 'suggestedAnswer',
			comment:
				'An answer (possibly one of several, possibly incorrect) to a Question, e.g. on a Question/Answer site.',
			rangeIncludes: ['Answer', 'ItemList'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgQuestion;
export const Question = schemaOrgQuestion;

export default schemaOrgQuestion;
