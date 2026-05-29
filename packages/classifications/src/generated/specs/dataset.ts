import type { ClassificationSpec } from '../../types.js';

export const dataset: ClassificationSpec = {
	slug: 'dataset',
	type: 'Dataset',
	displayName: 'Dataset',
	description: 'A dataset identity with a canonical dataset URL.',
	category: 'Creative Work',
	schemaOrg: { context: 'https://schema.org/', type: 'Dataset' },
	fields: [
		{
			key: 'name',
			label: 'Dataset Name',
			description: 'The name of the dataset.',
			fieldType: 'string',
			required: true,
			placeholder: 'Global Surface Temperature',
		},
		{
			key: 'url',
			label: 'Dataset URL',
			description: 'The canonical dataset URL.',
			fieldType: 'url',
			required: false,
			placeholder: 'https://example.org/datasets/global-surface-temperature',
		},
		{
			key: 'sameAs',
			label: 'Canonical References',
			description: 'Canonical references such as DOI links.',
			fieldType: 'string[]',
			required: false,
			placeholder: 'https://doi.org/10.1234/example-dataset',
		},
	],
	defaults: { pluginId: 'dataset', provider: 'opengraph' },
};
