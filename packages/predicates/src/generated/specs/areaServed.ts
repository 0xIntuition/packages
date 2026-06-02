import type { PredicateSpec } from '../../types.js';

export const areaServed = {
	key: 'areaServed',
	name: 'area served',
	description: 'The subject service or organization serves the object place or region',
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Metadata/Linking',
	status: 'proposed',
	relationships: {
		service: {
			direction: 'out',
			expectedObjectTypes: ['location'],
			schemaOrgProperty: 'areaServed',
		},
		company: {
			direction: 'out',
			expectedObjectTypes: ['location'],
			schemaOrgProperty: 'areaServed',
		},
		'local-business': {
			direction: 'out',
			expectedObjectTypes: ['location'],
			schemaOrgProperty: 'areaServed',
		},
	},
} as const satisfies PredicateSpec;
