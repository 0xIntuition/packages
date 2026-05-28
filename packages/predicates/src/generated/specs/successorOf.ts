import type { PredicateSpec } from '../../types.js';

export const successorOf = {
	key: 'successorOf',
	name: 'successor of',
	description: 'The subject is the next version or iteration following the object',
	marketPattern: 'comparative',
	conjugates: false,
	category: 'Comparison/Ranking',
	status: 'proposed',
	inversePredicate: 'predecessor of',
} as const satisfies PredicateSpec;
