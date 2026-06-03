import type { ClassificationSpec } from '../../types.js';

export const podcastSeries: ClassificationSpec = {
	slug: 'podcast-series',
	type: 'PodcastSeries',
	displayName: 'Podcast Series',
	description: 'A podcast series identity with a canonical series URL.',
	category: 'Media',
	schemaOrg: { context: 'https://schema.org/', type: 'PodcastSeries' },
	metadataPredicates: ['url', 'sameAs', 'createdBy', 'publisher', 'hasCategory', 'actor'] as const,
	fields: [
		{
			key: 'name',
			schemaOrgProperty: 'name',
			label: 'Series Name',
			description: 'The name of the podcast series.',
			fieldType: 'string',
			required: true,
			placeholder: 'Bankless',
		},
		{
			key: 'url',
			schemaOrgProperty: 'url',
			label: 'Series URL',
			description: 'The canonical podcast series URL.',
			fieldType: 'url',
			required: false,
			placeholder: 'https://www.bankless.com/podcast',
		},
		{
			key: 'sameAs',
			schemaOrgProperty: 'sameAs',
			label: 'Canonical References',
			description: 'Canonical references for the same podcast.',
			fieldType: 'string[]',
			required: false,
			placeholder: 'https://open.spotify.com/show/example',
		},
	],
	defaults: { pluginId: 'podcast-series', provider: 'opengraph' },
};
