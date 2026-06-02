import type { PredicateSpec } from '../../types.js';

export const productionCompany = {
	key: 'productionCompany',
	name: 'production company',
	description: 'The subject media work was produced by the object organization',
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Authorship/Contribution',
	status: 'proposed',
} as const satisfies PredicateSpec;
