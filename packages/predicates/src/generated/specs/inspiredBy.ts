import type { PredicateSpec } from '../../types.js';

export const inspiredBy = {
	key: 'inspiredBy',
	name: 'inspired by',
	description:
		'The subject was creatively or conceptually influenced by the object without direct derivation',
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Authorship/Contribution',
	status: 'proposed',
} as const satisfies PredicateSpec;
