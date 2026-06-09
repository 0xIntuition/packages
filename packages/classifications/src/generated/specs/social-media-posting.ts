import type { ClassificationSpec } from '../../types.js';

export const socialMediaPosting: ClassificationSpec = {
	slug: 'social-media-posting',
	type: 'SocialMediaPosting',
	displayName: 'Social Media Posting',
	description: 'A social media post with name, text, and canonical URL.',
	category: 'Web',
	schema: { context: 'https://schema.org/', type: 'SocialMediaPosting' },
	metadataPredicates: ['authoredBy', 'publishedAt', 'reference', 'url', 'hasTag'] as const,
	fields: [
		{
			key: 'name',
			schemaProperty: 'name',
			label: 'Post Title',
			description: 'A short title or name for the post.',
			fieldType: 'string',
			required: true,
			placeholder: 'Intuition Is Taking Over The World',
		},
		{
			key: 'text',
			schemaProperty: 'text',
			label: 'Post Text',
			description: 'The main text of the post.',
			fieldType: 'string',
			required: true,
			placeholder: 'Intuition, the onchain knowledge graph, is taking over the world.',
		},
		{
			key: 'url',
			schemaProperty: 'url',
			label: 'Post URL',
			description: 'The canonical post URL.',
			fieldType: 'url',
			required: false,
			placeholder: 'https://example.com/posts/launch-thread',
		},
	],
	defaults: { pluginId: 'social-media-posting' },
};
