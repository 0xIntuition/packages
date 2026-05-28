import type { PredicateSpec } from '../../types.js';

export const predecessorOf = {
	key: 'predecessorOf',
	name: 'predecessor of',
	description: 'The subject is an earlier version or iteration that came before the object',
	marketPattern: 'comparative',
	conjugates: false,
	category: 'Comparison/Ranking',
	status: 'proposed',
	inversePredicate: 'successor of',
} as const satisfies PredicateSpec;
