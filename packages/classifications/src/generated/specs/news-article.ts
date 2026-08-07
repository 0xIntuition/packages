import type { ClassificationSpec } from '../../types.js';

export const newsArticle: ClassificationSpec = {
	slug: 'news-article',
	type: 'NewsArticle',
	displayName: 'News Article',
	description: 'A news article with durable publication identity fields.',
	category: 'Creative Work',
	schema: { context: 'https://schema.org/', type: 'NewsArticle' },
	metadataPredicates: [
		'authoredBy',
		'publisher',
		'reference',
		'listedIn',
		'url',
		'sameAs',
		'hasCategory',
	] as const,
	fields: [
		{
			key: 'headline',
			schemaProperty: 'headline',
			label: 'Headline',
			description: 'The headline of the news article.',
			fieldType: 'string',
			required: true,
			placeholder: 'Intuition Launches v1',
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
			key: 'url',
			schemaProperty: 'url',
			label: 'Article URL',
			description: 'The canonical article URL.',
			fieldType: 'url',
			required: false,
			placeholder: 'https://example.com/news/intuition-launches-v1',
		},
		{
			key: 'sameAs',
			schemaProperty: 'sameAs',
			label: 'Canonical References',
			description: 'Canonical references for the same article.',
			fieldType: 'string[]',
			required: false,
			placeholder: 'https://example.com/news/intuition-launches-v1',
		},
	],
	defaults: { pluginId: 'news-article', provider: 'opengraph' },
	identity: {
		identifies: 'a news story as published (URL-anchored)',
		ladder: [
			{ kind: 'scheme', scheme: 'url', source: { kind: 'field', key: 'url' } },
			{ kind: 'scheme', scheme: 'url', source: { kind: 'same-as' } },
			{
				kind: 'gen1',
				tag: 2,
				recipe: [
					{ key: 'headline', from: 'field' },
					{ key: 'datePublished', from: 'field' },
				],
			},
			{ kind: 'gen1', tag: 3, recipe: [{ key: 'headline', from: 'field' }] },
		],
	},
};
