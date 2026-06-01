import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgAnswer = {
	id: 'schema:Answer',
	name: 'Answer',
	label: 'Answer',
	comment: 'An answer offered to a question; perhaps correct, perhaps opinionated or wrong.',
	subClassOf: ['Comment', 'CreativeWork', 'Thing'],
	properties: [
		{
			id: 'schema:answerExplanation',
			name: 'answerExplanation',
			label: 'answerExplanation',
			comment:
				'A step-by-step or full explanation about Answer. Can outline how this Answer was achieved or contain more broad clarification or statement about it. ',
			rangeIncludes: ['Comment', 'WebContent'],
		},
		{
			id: 'schema:parentItem',
			name: 'parentItem',
			label: 'parentItem',
			comment:
				'The parent of a question, answer or item in general. Typically used for Q/A discussion threads e.g. a chain of comments with the first comment being an [[Article]] or other [[CreativeWork]]. See also [[comment]] which points from something to a comment about it.',
			rangeIncludes: ['Comment', 'CreativeWork'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgAnswer;
export const Answer = schemaOrgAnswer;

export default schemaOrgAnswer;
