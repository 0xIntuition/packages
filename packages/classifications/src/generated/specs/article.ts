import type { ClassificationSpec } from '../../types.js';

export const article: ClassificationSpec = {
	slug: 'article',
	type: 'Article',
	displayName: 'Article',
	description: 'A written article with a durable headline and canonical URL.',
	category: 'Creative Work',
	schemaOrg: { context: 'https://schema.org/', type: 'Article' },
	fields: [
		{
			key: 'headline',
			label: 'Headline',
			description: 'The title or headline of the article.',
			fieldType: 'string',
			required: true,
			placeholder: 'Intuition Is Taking Over The World',
		},
		{
			key: 'description',
			label: 'Description',
			description: 'A short summary of the article.',
			fieldType: 'string',
			required: false,
			placeholder: 'Intuition, the onchain knowledge graph, is taking over the world.',
		},
		{
			key: 'url',
			label: 'Article URL',
			description: 'The canonical article URL.',
			fieldType: 'url',
			required: false,
			placeholder: 'https://example.com/article',
		},
	],
	defaults: { pluginId: 'article', provider: 'dictionary' },
};
