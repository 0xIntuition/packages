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
	objectKind: 'entity',
	temporalNature: 'permanent',
	claimType: 'factual',
	inverse: 'predecessorOf',
} as const satisfies PredicateSpec;
