import type { PredicateSpec } from '../../types.js';

export const brand = {
	key: 'brand',
	name: 'brand',
	description: 'The subject product, service, or organization is associated with the object brand',
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Identity/Classification',
	status: 'proposed',
	relationships: {
		product: {
			direction: 'out',
			expectedObjectTypes: ['brand', 'company'],
			schemaOrgProperty: 'brand',
		},
		service: {
			direction: 'out',
			expectedObjectTypes: ['brand', 'company'],
			schemaOrgProperty: 'brand',
		},
		company: {
			direction: 'out',
			expectedObjectTypes: ['brand', 'company'],
			schemaOrgProperty: 'brand',
		},
		'local-business': {
			direction: 'out',
			expectedObjectTypes: ['brand', 'company'],
			schemaOrgProperty: 'brand',
		},
	},
} as const satisfies PredicateSpec;
