import type { ClassificationSpec } from '../../types.js';

export const tvSeries: ClassificationSpec = {
	slug: 'tv-series',
	type: 'TVSeries',
	displayName: 'TV Series',
	description: 'A television series identity with optional start and end dates.',
	category: 'Media',
	schema: { context: 'https://schema.org/', type: 'TVSeries' },
	metadataPredicates: ['actor', 'director', 'productionCompany', 'trailer', 'sameAs'] as const,
	fields: [
		{
			key: 'name',
			schemaProperty: 'name',
			label: 'Series Title',
			description: 'The name of the TV series.',
			fieldType: 'string',
			required: true,
			placeholder: 'Severance',
		},
		{
			key: 'startDate',
			schemaProperty: 'startDate',
			label: 'Start Date',
			description: 'The series start date.',
			fieldType: 'iso-date',
			required: false,
			placeholder: '2022-02-18',
		},
		{
			key: 'endDate',
			schemaProperty: 'endDate',
			label: 'End Date',
			description: 'The series end date when known.',
			fieldType: 'iso-date',
			required: false,
			placeholder: '2026-03-01',
		},
		{
			key: 'sameAs',
			schemaProperty: 'sameAs',
			label: 'Canonical References',
			description: 'Canonical URLs for the same series.',
			fieldType: 'string[]',
			required: false,
			placeholder: 'https://www.imdb.com/title/tt11280740/',
		},
	],
	defaults: { pluginId: 'tv-series' },
	identity: {
		identifies: 'the series (seasons/episodes are unmodeled levels)',
		ladder: [
			// D27: open registries first
			{ kind: 'scheme', scheme: 'wd', source: { kind: 'same-as' } },
			{ kind: 'scheme', scheme: 'tmdb', source: { kind: 'same-as' } },
			{ kind: 'scheme', scheme: 'imdb', source: { kind: 'same-as' } },
			{
				kind: 'gen1',
				tag: 4,
				recipe: [
					{ key: 'name', from: 'field' },
					{ key: 'startYear', from: 'year', of: 'startDate' },
				],
			},
			{ kind: 'gen1', tag: 5, recipe: [{ key: 'name', from: 'field' }] },
		],
	},
};
