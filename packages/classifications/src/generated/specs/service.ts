import type { ClassificationSpec } from '../../types.js';

export const service: ClassificationSpec = {
	slug: 'service',
	type: 'Service',
	displayName: 'Service',
	description: 'A service identity with optional provider and area-served disambiguators.',
	category: 'Product',
	schema: { context: 'https://schema.org/', type: 'Service' },
	metadataPredicates: ['provider', 'areaServed', 'hasCategory', 'url', 'sameAs'] as const,
	fields: [
		{
			key: 'name',
			schemaProperty: 'name',
			label: 'Service Name',
			description: 'The service name.',
			fieldType: 'string',
			required: true,
			placeholder: 'ENS Name Service',
		},
		{
			key: 'provider',
			schemaProperty: 'provider',
			label: 'Provider',
			description: 'The provider name when needed.',
			fieldType: 'string',
			required: false,
			placeholder: 'ENS Labs',
		},
		{
			key: 'areaServed',
			schemaProperty: 'areaServed',
			label: 'Area Served',
			description: 'The served geography or audience when needed.',
			fieldType: 'string',
			required: false,
			placeholder: 'Global',
		},
		{
			key: 'sameAs',
			schemaProperty: 'sameAs',
			label: 'Canonical References',
			description: 'Canonical URLs for the same service.',
			fieldType: 'string[]',
			required: false,
			placeholder: 'https://ens.domains',
		},
	],
	defaults: { pluginId: 'service' },
	identity: {
		identifies: 'a service offering',
		ladder: [
			{ kind: 'scheme', scheme: 'url', source: { kind: 'same-as' } },
			// D21: provider omitted — provider linkage is a triple
			{ kind: 'gen1', tag: 2, recipe: [{ key: 'name', from: 'field' }] },
		],
	},
};
