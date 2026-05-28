import type { ClassificationSpec } from '../../types.js';

export const webPage: ClassificationSpec = {
	slug: 'web-page',
	type: 'WebPage',
	displayName: 'Web Page',
	description: 'A web page identity with a canonical URL.',
	category: 'Web',
	schemaOrg: { context: 'https://schema.org/', type: 'WebPage' },
	fields: [
		{
			key: 'name',
			label: 'Page Name',
			description: 'The page title or name.',
			fieldType: 'string',
			required: true,
			placeholder: 'Brad Pitt',
		},
		{
			key: 'url',
			label: 'Page URL',
			description: 'The canonical page URL.',
			fieldType: 'url',
			required: true,
			placeholder: 'https://en.wikipedia.org/wiki/Brad_Pitt',
		},
		{
			key: 'isPartOf',
			label: 'Website',
			description: 'The website name or URL that the page belongs to.',
			fieldType: 'string',
			required: false,
			placeholder: 'https://en.wikipedia.org',
		},
	],
	defaults: { pluginId: 'web-page', provider: 'opengraph' },
};
