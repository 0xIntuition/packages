import type { PredicateSpec } from '../../types.js';

export const outperform = {
	key: 'outperform',
	name: 'outperform',
	description:
		"The subject demonstrably exceeds the object on measurable criteria. Stronger than 'better than' — implies evidence",
	marketPattern: 'comparative',
	conjugates: true,
	thirdPerson: 'outperforms',
	category: 'Comparison/Ranking',
	status: 'proposed',
} as const satisfies PredicateSpec;
