import type { PredicateSpec } from '../../types.js';

export const manufacturer = {
	key: 'manufacturer',
	name: 'manufacturer',
	description: 'The subject product was manufactured by the object organization',
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Authorship/Contribution',
	status: 'proposed',
} as const satisfies PredicateSpec;
