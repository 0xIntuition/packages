import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgQuantitativeValueDistribution = {
	id: 'schema:QuantitativeValueDistribution',
	name: 'QuantitativeValueDistribution',
	label: 'QuantitativeValueDistribution',
	comment: 'A statistical distribution of values.',
	subClassOf: ['StructuredValue', 'Intangible', 'Thing'],
	properties: [
		{
			id: 'schema:duration',
			name: 'duration',
			label: 'duration',
			comment:
				'The duration of the item (movie, audio recording, event, etc.) in [ISO 8601 duration format](http://en.wikipedia.org/wiki/ISO_8601).',
			rangeIncludes: ['Duration', 'QuantitativeValue'],
		},
		{
			id: 'schema:median',
			name: 'median',
			label: 'median',
			comment: 'The median value.',
			rangeIncludes: ['Number'],
		},
		{
			id: 'schema:percentile10',
			name: 'percentile10',
			label: 'percentile10',
			comment: 'The 10th percentile value.',
			rangeIncludes: ['Number'],
		},
		{
			id: 'schema:percentile25',
			name: 'percentile25',
			label: 'percentile25',
			comment: 'The 25th percentile value.',
			rangeIncludes: ['Number'],
		},
		{
			id: 'schema:percentile75',
			name: 'percentile75',
			label: 'percentile75',
			comment: 'The 75th percentile value.',
			rangeIncludes: ['Number'],
		},
		{
			id: 'schema:percentile90',
			name: 'percentile90',
			label: 'percentile90',
			comment: 'The 90th percentile value.',
			rangeIncludes: ['Number'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgQuantitativeValueDistribution;
export const QuantitativeValueDistribution = schemaOrgQuantitativeValueDistribution;

export default schemaOrgQuantitativeValueDistribution;
