import type { ClassificationSpec } from '../../types.js';

export const thing: ClassificationSpec = {
	slug: 'thing',
	type: 'Thing',
	displayName: 'Thing',
	description: 'A broad tangible or conceptual thing with a name and description.',
	category: 'Entity',
	schema: { context: 'https://schema.org/', type: 'Thing' },
	metadataPredicates: ['sameAs', 'url', 'imgUrl', 'hasDescription'] as const,
	fields: [
		{
			key: 'name',
			schemaProperty: 'name',
			label: 'Thing Name',
			description: 'The name of the thing.',
			fieldType: 'string',
			required: true,
			placeholder: 'Apple',
		},
		{
			key: 'description',
			schemaProperty: 'description',
			label: 'Description',
			description: 'A short description of the thing.',
			fieldType: 'string',
			required: false,
			placeholder: 'A round fruit with red or green skin.',
		},
	],
	defaults: { pluginId: 'thing', provider: 'wikidata' },
};
