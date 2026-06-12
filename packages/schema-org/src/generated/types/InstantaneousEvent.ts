import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgInstantaneousEvent = {
	id: 'schema:InstantaneousEvent',
	name: 'InstantaneousEvent',
	label: 'InstantaneousEvent',
	comment: 'An event with no duration, like for instance a computer log entry.',
	subClassOf: ['StructuredValue', 'Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:data',
			name: 'data',
			label: 'data',
			comment: 'Data associated with the event, like for instance a log message.',
			rangeIncludes: ['Thing'],
		},
		{
			id: 'schema:source',
			name: 'source',
			label: 'source',
			comment: 'The source or cause of the event.',
			rangeIncludes: ['Thing'],
		},
		{
			id: 'schema:timestamp',
			name: 'timestamp',
			label: 'timestamp',
			comment: 'The instant the event occured.',
			rangeIncludes: ['DateTime'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgInstantaneousEvent;
export const InstantaneousEvent = schemaOrgInstantaneousEvent;

export default schemaOrgInstantaneousEvent;
