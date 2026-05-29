import type { PredicateSpec } from '../../types.js';

export const supersede = {
	key: 'supersede',
	name: 'supersede',
	description:
		'The subject is the designated replacement for the object. Implies the object is deprecated or obsolete',
	marketPattern: 'comparative',
	conjugates: false,
	category: 'Comparison/Ranking',
	status: 'proposed',
} as const satisfies PredicateSpec;
