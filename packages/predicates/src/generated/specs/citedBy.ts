import type { PredicateSpec } from '../../types.js';

export const citedBy = {
	key: 'citedBy',
	name: 'cited by',
	description:
		'The subject work is referenced or cited in the object work. A backward citation link',
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Provenance/Evidence',
	status: 'proposed',
	inversePredicate: 'reference',
} as const satisfies PredicateSpec;
