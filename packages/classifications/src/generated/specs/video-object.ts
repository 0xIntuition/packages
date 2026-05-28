import type { ClassificationSpec } from '../../types.js';

export const videoObject: ClassificationSpec = {
	slug: 'video-object',
	type: 'VideoObject',
	displayName: 'Video Object',
	description: 'A video identity with optional description and content URL.',
	category: 'Media',
	schemaOrg: { context: 'https://schema.org/', type: 'VideoObject' },
	fields: [
		{
			key: 'name',
			label: 'Video Title',
			description: 'The title of the video.',
			fieldType: 'string',
			required: true,
			placeholder: 'How Intuition Works',
		},
		{
			key: 'description',
			label: 'Description',
			description: 'A short description of the video.',
			fieldType: 'string',
			required: false,
			placeholder: 'A walkthrough of the Intuition protocol.',
		},
		{
			key: 'contentUrl',
			label: 'Content URL',
			description: 'The video content or canonical URL.',
			fieldType: 'url',
			required: false,
			placeholder: 'https://example.com/videos/how-intuition-works',
		},
		{
			key: 'sameAs',
			label: 'Canonical References',
			description: 'Canonical URLs for the same video.',
			fieldType: 'string[]',
			required: false,
			placeholder: 'https://www.youtube.com/watch?v=example',
		},
	],
	defaults: { pluginId: 'video-object' },
};
