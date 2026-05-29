import type { ClassificationSpec } from '../../types.js';

export const brand: ClassificationSpec = {
	slug: 'brand',
	type: 'Brand',
	displayName: 'Brand',
	description: 'A brand identity with a name and optional canonical references.',
	category: 'Entity',
	schemaOrg: { context: 'https://schema.org/', type: 'Brand' },
	fields: [
		{
			key: 'name',
			label: 'Brand Name',
			description: 'The human-readable brand name.',
			fieldType: 'string',
			required: true,
			placeholder: 'Patagonia',
		},
		{
			key: 'url',
			label: 'Official Website',
			description: 'The official website when available.',
			fieldType: 'url',
			required: false,
			placeholder: 'https://www.patagonia.com',
		},
		{
			key: 'sameAs',
			label: 'Canonical References',
			description: 'Canonical URLs for the same brand.',
			fieldType: 'string[]',
			required: false,
			placeholder: 'https://www.wikidata.org/wiki/Q223269',
		},
	],
	defaults: { pluginId: 'brand', provider: 'company-profile' },
};
