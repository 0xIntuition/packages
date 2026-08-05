import type { ClassificationSpec } from '../../types.js';

export const podcastEpisode: ClassificationSpec = {
	slug: 'podcast-episode',
	type: 'PodcastEpisode',
	displayName: 'Podcast Episode',
	description: 'A podcast episode with a canonical episode URL.',
	category: 'Media',
	schema: { context: 'https://schema.org/', type: 'PodcastEpisode' },
	metadataPredicates: ['partOfSeries', 'url', 'productionCompany', 'trailer', 'sameAs'] as const,
	fields: [
		{
			key: 'name',
			schemaProperty: 'name',
			label: 'Episode Name',
			description: 'The title of the episode.',
			fieldType: 'string',
			required: true,
			placeholder: 'The Future of Onchain Reputation',
		},
		{
			key: 'url',
			schemaProperty: 'url',
			label: 'Episode URL',
			description: 'The canonical episode URL.',
			fieldType: 'url',
			required: false,
			placeholder: 'https://example.com/podcast/episodes/onchain-reputation',
		},
		{
			key: 'partOfSeries',
			schemaProperty: 'partOfSeries',
			label: 'Series',
			description: 'The series name or URL the episode belongs to.',
			fieldType: 'string',
			required: false,
			placeholder: 'https://example.com/podcast',
		},
		{
			key: 'datePublished',
			schemaProperty: 'datePublished',
			label: 'Publication Date',
			description: 'The publication date.',
			fieldType: 'iso-date',
			required: false,
			placeholder: '2026-02-26',
		},
		{
			key: 'feedGuid',
			label: 'Feed GUID',
			description: 'The Podcasting 2.0 GUID of the feed this item belongs to.',
			fieldType: 'string',
			required: false,
			placeholder: '917393e3-1b1e-5cef-ace4-edaa54e1f810',
		},
		{
			key: 'itemGuid',
			label: 'Item GUID',
			description: 'The RSS <guid> value of this episode item within its feed.',
			fieldType: 'string',
			required: false,
			placeholder: 'urn:example:ep42',
		},
		{
			key: 'sameAs',
			schemaProperty: 'sameAs',
			label: 'Canonical References',
			description: 'Canonical URLs that identify the same podcast episode.',
			fieldType: 'string[]',
			required: false,
			placeholder: 'https://example.com/...',
		},
	],
	defaults: { pluginId: 'podcast-episode', provider: 'opengraph' },
	identity: {
		identifies:
			'one FEED ITEM (manifestation) — the episode-work is the equivalence cluster over feed items (D26)',
		ladder: [
			{ kind: 'scheme', scheme: 'rssitem', source: { kind: 'derivation', name: 'rss-item' } },
			{ kind: 'scheme', scheme: 'url', source: { kind: 'field', key: 'url' } },
			// D21: partOfSeries omitted — series linkage is a triple
			{
				kind: 'gen1',
				tag: 3,
				recipe: [
					{ key: 'name', from: 'field' },
					{ key: 'datePublished', from: 'field' },
				],
			},
			{ kind: 'gen1', tag: 4, recipe: [{ key: 'name', from: 'field' }] },
		],
	},
};
