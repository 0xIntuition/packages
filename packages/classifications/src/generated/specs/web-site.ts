import type { ClassificationSpec } from '../../types.js';

export const webSite: ClassificationSpec = {
	slug: 'web-site',
	type: 'WebSite',
	displayName: 'Website',
	description: 'A website identity with name and canonical URL.',
	category: 'Web',
	schema: { context: 'https://schema.org/', type: 'WebSite' },
	metadataPredicates: ['publisher', 'createdBy', 'hasTag', 'hasCategory', 'url', 'sameAs'] as const,
	fields: [
		{
			key: 'name',
			schemaProperty: 'name',
			label: 'Site Name',
			description: 'The name of the website.',
			fieldType: 'string',
			required: true,
			placeholder: 'Wikipedia',
		},
		{
			key: 'url',
			schemaProperty: 'url',
			label: 'Site URL',
			description: 'The canonical website URL.',
			fieldType: 'url',
			required: true,
			placeholder: 'https://www.wikipedia.org',
		},
		{
			key: 'sameAs',
			schemaProperty: 'sameAs',
			label: 'Canonical References',
			description: 'Canonical URLs that identify the same website.',
			fieldType: 'string[]',
			required: false,
			placeholder: 'https://example.com/...',
		},
	],
	defaults: { pluginId: 'web-site', provider: 'opengraph' },
};
