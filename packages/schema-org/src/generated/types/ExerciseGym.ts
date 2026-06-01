import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgExerciseGym = {
	id: 'schema:ExerciseGym',
	name: 'ExerciseGym',
	label: 'ExerciseGym',
	comment: 'A gym.',
	subClassOf: ['SportsActivityLocation', 'LocalBusiness', 'Organization', 'Thing', 'Place'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgExerciseGym;
export const ExerciseGym = schemaOrgExerciseGym;

export default schemaOrgExerciseGym;
