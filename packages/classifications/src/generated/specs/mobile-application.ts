import type { ClassificationSpec } from '../../types.js';

export const mobileApplication: ClassificationSpec = {
	slug: 'mobile-application',
	type: 'MobileApplication',
	displayName: 'Mobile Application',
	description: 'A mobile app identity with the app name and target platforms.',
	category: 'Product',
	schemaOrg: { context: 'https://schema.org/', type: 'MobileApplication' },
	fields: [
		{
			key: 'name',
			label: 'Application Name',
			description: 'The mobile application name.',
			fieldType: 'string',
			required: true,
			placeholder: 'Spotify',
		},
		{
			key: 'operatingSystem',
			label: 'Operating System',
			description: 'The supported operating systems.',
			fieldType: 'string',
			required: true,
			placeholder: 'iOS, Android',
		},
		{
			key: 'applicationCategory',
			label: 'Application Category',
			description: 'The app category when needed.',
			fieldType: 'string',
			required: false,
			placeholder: 'Music',
		},
		{
			key: 'downloadUrl',
			label: 'Download URL',
			description: 'The store or download URL.',
			fieldType: 'url',
			required: false,
			placeholder: 'https://apps.apple.com/app/spotify/id324684580',
		},
	],
	defaults: { pluginId: 'mobile-application', provider: 'opengraph' },
};
