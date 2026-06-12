import type { ClassificationSpec } from '../../types.js';

export const movie: ClassificationSpec = {
	slug: 'movie',
	type: 'Movie',
	displayName: 'Movie',
	description: 'A movie identity with release-date disambiguation when needed.',
	category: 'Media',
	schema: { context: 'https://schema.org/', type: 'Movie' },
	metadataPredicates: [
		'actor',
		'director',
		'productionCompany',
		'musicBy',
		'trailer',
		'hasCategory',
		'sameAs',
	] as const,
	fields: [
		{
			key: 'name',
			schemaProperty: 'name',
			label: 'Movie Title',
			description: 'The title of the movie.',
			fieldType: 'string',
			required: true,
			placeholder: 'Inception',
		},
		{
			key: 'datePublished',
			schemaProperty: 'datePublished',
			label: 'Release Date',
			description: 'The release date when needed.',
			fieldType: 'iso-date',
			required: false,
			placeholder: '2010-07-16',
		},
		{
			key: 'sameAs',
			schemaProperty: 'sameAs',
			label: 'Canonical References',
			description: 'Canonical URLs for the same movie.',
			fieldType: 'string[]',
			required: false,
			placeholder: 'https://www.imdb.com/title/tt1375666/',
		},
	],
	defaults: { pluginId: 'movie' },
};
