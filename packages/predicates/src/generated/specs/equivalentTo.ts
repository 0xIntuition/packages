import type { PredicateSpec } from '../../types.js';

export const equivalentTo = {
	key: 'equivalentTo',
	name: 'equivalent to',
	description:
		"The subject and object are functionally interchangeable or at parity. Distinct from 'same as' — the entities are different but serve the same role",
	marketPattern: 'comparative',
	conjugates: false,
	category: 'Comparison/Ranking',
	status: 'proposed',
	isTransitive: true,
	isSymmetric: true,
} as const satisfies PredicateSpec;
