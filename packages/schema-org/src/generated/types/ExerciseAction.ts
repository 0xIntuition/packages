import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgExerciseAction = {
	id: 'schema:ExerciseAction',
	name: 'ExerciseAction',
	label: 'ExerciseAction',
	comment:
		'The act of participating in exertive activity for the purposes of improving health and fitness.',
	subClassOf: ['PlayAction', 'Action', 'Thing'],
	properties: [
		{
			id: 'schema:course',
			name: 'course',
			label: 'course',
			comment: 'A sub property of location. The course where this action was taken.',
			rangeIncludes: ['Place'],
		},
		{
			id: 'schema:diet',
			name: 'diet',
			label: 'diet',
			comment: 'A sub property of instrument. The diet used in this action.',
			rangeIncludes: ['Diet'],
		},
		{
			id: 'schema:distance',
			name: 'distance',
			label: 'distance',
			comment: 'The distance travelled, e.g. exercising or travelling.',
			rangeIncludes: ['Distance'],
		},
		{
			id: 'schema:exerciseCourse',
			name: 'exerciseCourse',
			label: 'exerciseCourse',
			comment: 'A sub property of location. The course where this action was taken.',
			rangeIncludes: ['Place'],
		},
		{
			id: 'schema:exercisePlan',
			name: 'exercisePlan',
			label: 'exercisePlan',
			comment: 'A sub property of instrument. The exercise plan used on this action.',
			rangeIncludes: ['ExercisePlan'],
		},
		{
			id: 'schema:exerciseRelatedDiet',
			name: 'exerciseRelatedDiet',
			label: 'exerciseRelatedDiet',
			comment: 'A sub property of instrument. The diet used in this action.',
			rangeIncludes: ['Diet'],
		},
		{
			id: 'schema:exerciseType',
			name: 'exerciseType',
			label: 'exerciseType',
			comment:
				'Type(s) of exercise or activity, such as strength training, flexibility training, aerobics, cardiac rehabilitation, etc.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:fromLocation',
			name: 'fromLocation',
			label: 'fromLocation',
			comment:
				'A sub property of location. The original location of the object or the agent before the action.',
			rangeIncludes: ['Place'],
		},
		{
			id: 'schema:opponent',
			name: 'opponent',
			label: 'opponent',
			comment: 'A sub property of participant. The opponent on this action.',
			rangeIncludes: ['Person'],
		},
		{
			id: 'schema:sportsActivityLocation',
			name: 'sportsActivityLocation',
			label: 'sportsActivityLocation',
			comment:
				'A sub property of location. The sports activity location where this action occurred.',
			rangeIncludes: ['SportsActivityLocation'],
		},
		{
			id: 'schema:sportsEvent',
			name: 'sportsEvent',
			label: 'sportsEvent',
			comment: 'A sub property of location. The sports event where this action occurred.',
			rangeIncludes: ['SportsEvent'],
		},
		{
			id: 'schema:sportsTeam',
			name: 'sportsTeam',
			label: 'sportsTeam',
			comment: 'A sub property of participant. The sports team that participated on this action.',
			rangeIncludes: ['SportsTeam'],
		},
		{
			id: 'schema:toLocation',
			name: 'toLocation',
			label: 'toLocation',
			comment:
				'A sub property of location. The final location of the object or the agent after the action.',
			rangeIncludes: ['Place'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgExerciseAction;
export const ExerciseAction = schemaOrgExerciseAction;

export default schemaOrgExerciseAction;
