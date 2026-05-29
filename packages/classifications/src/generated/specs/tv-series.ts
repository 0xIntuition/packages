import type { ClassificationSpec } from '../../types.js';

export const tvSeries: ClassificationSpec = {
	slug: 'tv-series',
	type: 'TVSeries',
	displayName: 'TV Series',
	description: 'A television series identity with optional start and end dates.',
	category: 'Media',
	schemaOrg: { context: 'https://schema.org/', type: 'TVSeries' },
	fields: [
		{
			key: 'name',
			label: 'Series Title',
			description: 'The name of the TV series.',
			fieldType: 'string',
			required: true,
			placeholder: 'Severance',
		},
		{
			key: 'startDate',
			label: 'Start Date',
			description: 'The series start date.',
			fieldType: 'iso-date',
			required: false,
			placeholder: '2022-02-18',
		},
		{
			key: 'endDate',
			label: 'End Date',
			description: 'The series end date when known.',
			fieldType: 'iso-date',
			required: false,
			placeholder: '2026-03-01',
		},
		{
			key: 'sameAs',
			label: 'Canonical References',
			description: 'Canonical URLs for the same series.',
			fieldType: 'string[]',
			required: false,
			placeholder: 'https://www.imdb.com/title/tt11280740/',
		},
	],
	defaults: { pluginId: 'tv-series' },
};
