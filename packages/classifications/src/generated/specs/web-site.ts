import type { ClassificationSpec } from '../../types.js';

export const webSite: ClassificationSpec = {
	slug: 'web-site',
	type: 'WebSite',
	displayName: 'Website',
	description: 'A website identity with name and canonical URL.',
	category: 'Web',
	schemaOrg: { context: 'https://schema.org/', type: 'WebSite' },
	fields: [
		{
			key: 'name',
			label: 'Site Name',
			description: 'The name of the website.',
			fieldType: 'string',
			required: true,
			placeholder: 'Wikipedia',
		},
		{
			key: 'url',
			label: 'Site URL',
			description: 'The canonical website URL.',
			fieldType: 'url',
			required: true,
			placeholder: 'https://www.wikipedia.org',
		},
	],
	defaults: { pluginId: 'web-site', provider: 'opengraph' },
};
