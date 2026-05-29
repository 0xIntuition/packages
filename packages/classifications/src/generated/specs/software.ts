import type { ClassificationSpec } from '../../types.js';

export const software: ClassificationSpec = {
	slug: 'software',
	type: 'SoftwareSourceCode',
	displayName: 'Software',
	description: 'A code project or software identity with a canonical repository URL.',
	category: 'Product',
	schemaOrg: { context: 'https://schema.org/', type: 'SoftwareSourceCode' },
	fields: [
		{
			key: 'name',
			label: 'Software Name',
			description: 'The software or project name.',
			fieldType: 'string',
			required: true,
			placeholder: 'intuition-data-structure',
		},
		{
			key: 'codeRepository',
			label: 'Repository URL',
			description: 'The canonical code repository URL.',
			fieldType: 'url',
			required: true,
			placeholder: 'https://github.com/0xintuition/intuition-data-structure',
		},
	],
	defaults: { pluginId: 'software', provider: 'github' },
};
