import type { ClassificationSpec } from '../../types.js';

export const company: ClassificationSpec = {
	slug: 'company',
	type: 'Organization',
	displayName: 'Company',
	description: 'An organization identity with optional canonical references.',
	category: 'Entity',
	schemaOrg: { context: 'https://schema.org/', type: 'Organization' },
	fields: [
		{
			key: 'name',
			label: 'Company Name',
			description: 'The official or common company name.',
			fieldType: 'string',
			required: true,
			placeholder: 'Intuition Labs',
		},
		{
			key: 'url',
			label: 'Official Website',
			description: 'The official company website when needed.',
			fieldType: 'url',
			required: false,
			placeholder: 'https://intuition.systems',
		},
		{
			key: 'sameAs',
			label: 'Canonical References',
			description: 'Canonical URLs for the same organization.',
			fieldType: 'string[]',
			required: false,
			placeholder: 'https://www.wikidata.org/wiki/...',
		},
	],
	defaults: { pluginId: 'company' },
};
