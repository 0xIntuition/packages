import type { ClassificationSpec } from '../../types.js';

export const image: ClassificationSpec = {
	slug: 'image',
	type: 'ImageObject',
	displayName: 'Image',
	description: 'An image identity with a canonical source URL.',
	category: 'Media',
	schemaOrg: { context: 'https://schema.org/', type: 'ImageObject' },
	fields: [
		{
			key: 'name',
			label: 'Image Name',
			description: 'The image name or title.',
			fieldType: 'string',
			required: true,
			placeholder: 'knowledge-graph',
		},
		{
			key: 'url',
			label: 'Image URL',
			description: 'The canonical image URL.',
			fieldType: 'url',
			required: true,
			placeholder: 'https://example.com/image.png',
		},
		{
			key: 'caption',
			label: 'Caption',
			description: 'A caption or short text describing the image.',
			fieldType: 'string',
			required: false,
			placeholder: 'The world is filled with knowledge.',
		},
		{
			key: 'keywords',
			label: 'Keywords',
			description: 'Keywords that describe the image.',
			fieldType: 'string[]',
			required: false,
			placeholder: 'knowledge-graph',
		},
	],
	defaults: { pluginId: 'image', provider: 'github' },
};
