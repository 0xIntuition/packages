import type { ClassificationSpec } from '../../types.js';

export const podcastSeries: ClassificationSpec = {
	slug: 'podcast-series',
	type: 'PodcastSeries',
	displayName: 'Podcast Series',
	description: 'A podcast series identity with a canonical series URL.',
	category: 'Media',
	schema: { context: 'https://schema.org/', type: 'PodcastSeries' },
	metadataPredicates: ['url', 'sameAs', 'createdBy', 'publisher', 'hasCategory', 'actor'] as const,
	fields: [
		{
			key: 'name',
			schemaProperty: 'name',
			label: 'Series Name',
			description: 'The name of the podcast series.',
			fieldType: 'string',
			required: true,
			placeholder: 'Bankless',
		},
		{
			key: 'url',
			schemaProperty: 'url',
			label: 'Series URL',
			description: 'The canonical podcast series URL.',
			fieldType: 'url',
			required: false,
			placeholder: 'https://www.bankless.com/podcast',
		},
		{
			key: 'feedUrl',
			schemaProperty: 'webFeed',
			label: 'RSS Feed URL',
			description: 'The RSS feed URL; used to derive the Podcasting 2.0 GUID.',
			fieldType: 'url',
			required: false,
			placeholder: 'https://feeds.example.com/show.xml',
		},
		{
			key: 'podcastGuid',
			label: 'Podcast GUID',
			description: 'The declared Podcasting 2.0 <podcast:guid> value; survives feed migrations.',
			fieldType: 'string',
			required: false,
			placeholder: '917393e3-1b1e-5cef-ace4-edaa54e1f810',
		},
		{
			key: 'sameAs',
			schemaProperty: 'sameAs',
			label: 'Canonical References',
			description: 'Canonical references for the same podcast.',
			fieldType: 'string[]',
			required: false,
			placeholder: 'https://open.spotify.com/show/example',
		},
	],
	defaults: { pluginId: 'podcast-series', provider: 'opengraph' },
	identity: {
		identifies: 'the show (feed level)',
		ladder: [
			// D26: the declared <podcast:guid> survives feed migrations
			{ kind: 'scheme', scheme: 'podcastguid', source: { kind: 'field', key: 'podcastGuid' } },
			// derived from the feed URL — forks on migration, fallback only
			{ kind: 'scheme', scheme: 'podcastguid', source: { kind: 'podcast-guid', key: 'feedUrl' } },
			{ kind: 'scheme', scheme: 'url', source: { kind: 'field', key: 'url' } },
			{ kind: 'gen1', tag: 3, recipe: [{ key: 'name', from: 'field' }] },
		],
	},
};
