import type { PredicateSpec } from '../../types.js';

export const manufacturer = {
	key: 'manufacturer',
	name: 'manufacturer',
	description: 'The subject product was manufactured by the object organization',
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Authorship/Contribution',
	status: 'proposed',
	relationships: {
		product: {
			direction: 'out',
			expectedObjectTypes: ['company'],
			schemaOrgProperty: 'manufacturer',
		},
	},
} as const satisfies PredicateSpec;
