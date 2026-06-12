import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgQuiz = {
	id: 'schema:Quiz',
	name: 'Quiz',
	label: 'Quiz',
	comment: 'Quiz: A test of knowledge, skills and abilities.',
	subClassOf: ['LearningResource', 'CreativeWork', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgQuiz;
export const Quiz = schemaOrgQuiz;

export default schemaOrgQuiz;
