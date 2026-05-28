import type { ClassificationSpec } from '../../types.js';

export const softwareApplication: ClassificationSpec = {
	slug: 'software-application',
	type: 'SoftwareApplication',
	displayName: 'Software Application',
	description: 'A software application identity with optional category and platform metadata.',
	category: 'Product',
	schemaOrg: { context: 'https://schema.org/', type: 'SoftwareApplication' },
	fields: [
		{
			key: 'name',
			label: 'Application Name',
			description: 'The software application name.',
			fieldType: 'string',
			required: true,
			placeholder: 'Notion',
		},
		{
			key: 'applicationCategory',
			label: 'Application Category',
			description: 'The application category when needed.',
			fieldType: 'string',
			required: false,
			placeholder: 'Productivity',
		},
		{
			key: 'operatingSystem',
			label: 'Operating System',
			description: 'The target operating system when needed.',
			fieldType: 'string',
			required: false,
			placeholder: 'Web',
		},
		{
			key: 'url',
			label: 'Application URL',
			description: 'The canonical app URL.',
			fieldType: 'url',
			required: false,
			placeholder: 'https://www.notion.so',
		},
	],
	defaults: { pluginId: 'software-application', provider: 'opengraph' },
};
