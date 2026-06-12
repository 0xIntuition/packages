import type { ClassificationSpec } from '../../types.js';

export const socialMediaAccount: ClassificationSpec = {
	slug: 'social-media-account',
	type: 'SocialMediaAccount',
	displayName: 'Social Media Account',
	description: 'A social profile identity keyed by username and platform.',
	category: 'Web',
	schema: {
		context: 'https://schema.intuition.systems/v1/social-media-account.jsonld',
		type: 'SocialMediaAccount',
	},
	metadataPredicates: ['linkedAccount', 'url', 'availableOn'] as const,
	fields: [
		{
			key: 'username',
			label: 'Username',
			description: 'The handle or account username.',
			fieldType: 'string',
			required: true,
			placeholder: 'karpathy',
		},
		{
			key: 'platform',
			label: 'Platform',
			description: 'The social platform name.',
			fieldType: 'string',
			required: true,
			placeholder: 'x',
		},
		{
			key: 'url',
			label: 'Profile URL',
			description: 'The canonical profile URL.',
			fieldType: 'url',
			required: false,
			placeholder: 'https://x.com/karpathy',
		},
	],
	defaults: { pluginId: 'social-media-account' },
};
