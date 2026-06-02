import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgExercisePlan = {
	id: 'schema:ExercisePlan',
	name: 'ExercisePlan',
	label: 'ExercisePlan',
	comment:
		'Fitness-related activity designed for a specific health-related purpose, including defined exercise routines as well as activity prescribed by a clinician.',
	subClassOf: [
		'CreativeWork',
		'PhysicalActivity',
		'Thing',
		'LifestyleModification',
		'MedicalEntity',
	],
	properties: [
		{
			id: 'schema:activityDuration',
			name: 'activityDuration',
			label: 'activityDuration',
			comment: 'Length of time to engage in the activity.',
			rangeIncludes: ['Duration', 'QuantitativeValue'],
		},
		{
			id: 'schema:activityFrequency',
			name: 'activityFrequency',
			label: 'activityFrequency',
			comment: 'How often one should engage in the activity.',
			rangeIncludes: ['QuantitativeValue', 'Text'],
		},
		{
			id: 'schema:additionalVariable',
			name: 'additionalVariable',
			label: 'additionalVariable',
			comment:
				'Any additional component of the exercise prescription that may need to be articulated to the patient. This may include the order of exercises, the number of repetitions of movement, quantitative distance, progressions over time, etc.',
			rangeIncludes: ['Text'],
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
			id: 'schema:intensity',
			name: 'intensity',
			label: 'intensity',
			comment:
				'Quantitative measure gauging the degree of force involved in the exercise, for example, heartbeats per minute. May include the velocity of the movement.',
			rangeIncludes: ['QuantitativeValue', 'Text'],
		},
		{
			id: 'schema:repetitions',
			name: 'repetitions',
			label: 'repetitions',
			comment: 'Number of times one should repeat the activity.',
			rangeIncludes: ['Number', 'QuantitativeValue'],
		},
		{
			id: 'schema:restPeriods',
			name: 'restPeriods',
			label: 'restPeriods',
			comment: 'How often one should break from the activity.',
			rangeIncludes: ['QuantitativeValue', 'Text'],
		},
		{
			id: 'schema:workload',
			name: 'workload',
			label: 'workload',
			comment:
				'Quantitative measure of the physiologic output of the exercise; also referred to as energy expenditure.',
			rangeIncludes: ['Energy', 'QuantitativeValue'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgExercisePlan;
export const ExercisePlan = schemaOrgExercisePlan;

export default schemaOrgExercisePlan;
