import type { ClassificationSpec } from '../../types.js';

export const podcastEpisode: ClassificationSpec = {
	slug: 'podcast-episode',
	type: 'PodcastEpisode',
	displayName: 'Podcast Episode',
	description: 'A podcast episode with a canonical episode URL.',
	category: 'Media',
	schemaOrg: { context: 'https://schema.org/', type: 'PodcastEpisode' },
	fields: [
		{
			key: 'name',
			label: 'Episode Name',
			description: 'The title of the episode.',
			fieldType: 'string',
			required: true,
			placeholder: 'The Future of Onchain Reputation',
		},
		{
			key: 'url',
			label: 'Episode URL',
			description: 'The canonical episode URL.',
			fieldType: 'url',
			required: false,
			placeholder: 'https://example.com/podcast/episodes/onchain-reputation',
		},
		{
			key: 'partOfSeries',
			label: 'Series',
			description: 'The series name or URL the episode belongs to.',
			fieldType: 'string',
			required: false,
			placeholder: 'https://example.com/podcast',
		},
		{
			key: 'datePublished',
			label: 'Publication Date',
			description: 'The publication date.',
			fieldType: 'iso-date',
			required: false,
			placeholder: '2026-02-26',
		},
	],
	defaults: { pluginId: 'podcast-episode', provider: 'opengraph' },
};
