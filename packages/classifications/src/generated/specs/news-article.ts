import type { ClassificationSpec } from '../../types.js';

export const newsArticle: ClassificationSpec = {
	slug: 'news-article',
	type: 'NewsArticle',
	displayName: 'News Article',
	description: 'A news article with durable publication identity fields.',
	category: 'Creative Work',
	schemaOrg: { context: 'https://schema.org/', type: 'NewsArticle' },
	fields: [
		{
			key: 'headline',
			label: 'Headline',
			description: 'The headline of the news article.',
			fieldType: 'string',
			required: true,
			placeholder: 'Intuition Launches v1',
		},
		{
			key: 'datePublished',
			label: 'Publication Date',
			description: 'The publication date.',
			fieldType: 'iso-date',
			required: false,
			placeholder: '2026-02-26',
		},
		{
			key: 'url',
			label: 'Article URL',
			description: 'The canonical article URL.',
			fieldType: 'url',
			required: false,
			placeholder: 'https://example.com/news/intuition-launches-v1',
		},
		{
			key: 'sameAs',
			label: 'Canonical References',
			description: 'Canonical references for the same article.',
			fieldType: 'string[]',
			required: false,
			placeholder: 'https://example.com/news/intuition-launches-v1',
		},
	],
	defaults: { pluginId: 'news-article', provider: 'opengraph' },
};
