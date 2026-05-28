import type { ClassificationSpec } from '../../types.js';

export const comment: ClassificationSpec = {
	slug: 'comment',
	type: 'Comment',
	displayName: 'Comment',
	description: 'A minimal comment identity linked to a stable target.',
	category: 'Creative Work',
	schemaOrg: { context: 'https://schema.org/', type: 'Comment' },
	fields: [
		{
			key: 'text',
			label: 'Comment Text',
			description: 'The text body of the comment.',
			fieldType: 'string',
			required: true,
			placeholder: 'This launch thread is incredibly useful.',
		},
		{
			key: 'about',
			label: 'Target',
			description: 'The target identifier or URL the comment is about.',
			fieldType: 'string',
			required: false,
			placeholder: 'https://example.com/posts/launch-thread',
		},
		{
			key: 'dateCreated',
			label: 'Date Created',
			description: 'The date the comment was created.',
			fieldType: 'iso-date',
			required: false,
			placeholder: '2026-02-26',
		},
		{
			key: 'sameAs',
			label: 'Canonical References',
			description: 'Canonical URLs for the same comment.',
			fieldType: 'string[]',
			required: false,
			placeholder: 'https://example.com/posts/launch-thread#comment-42',
		},
	],
	defaults: { pluginId: 'comment', provider: 'social-media-posting' },
};
