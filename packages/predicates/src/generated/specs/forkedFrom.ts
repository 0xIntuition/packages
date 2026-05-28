import type { PredicateSpec } from '../../types.js';

export const forkedFrom = {
	key: 'forkedFrom',
	name: 'forked from',
	description: 'The subject was created as a divergent copy or branch of the object',
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Authorship/Contribution',
	status: 'proposed',
} as const satisfies PredicateSpec;
