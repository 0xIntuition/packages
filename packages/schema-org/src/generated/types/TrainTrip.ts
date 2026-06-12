import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgTrainTrip = {
	id: 'schema:TrainTrip',
	name: 'TrainTrip',
	label: 'TrainTrip',
	comment: 'A trip on a commercial train line.',
	subClassOf: ['Trip', 'Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:arrivalPlatform',
			name: 'arrivalPlatform',
			label: 'arrivalPlatform',
			comment: 'The platform where the train arrives.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:arrivalStation',
			name: 'arrivalStation',
			label: 'arrivalStation',
			comment: 'The station where the train trip ends.',
			rangeIncludes: ['TrainStation'],
		},
		{
			id: 'schema:departurePlatform',
			name: 'departurePlatform',
			label: 'departurePlatform',
			comment: 'The platform from which the train departs.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:departureStation',
			name: 'departureStation',
			label: 'departureStation',
			comment: 'The station from which the train departs.',
			rangeIncludes: ['TrainStation'],
		},
		{
			id: 'schema:trainName',
			name: 'trainName',
			label: 'trainName',
			comment: 'The name of the train (e.g. The Orient Express).',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:trainNumber',
			name: 'trainNumber',
			label: 'trainNumber',
			comment: 'The unique identifier for the train.',
			rangeIncludes: ['Text'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgTrainTrip;
export const TrainTrip = schemaOrgTrainTrip;

export default schemaOrgTrainTrip;
