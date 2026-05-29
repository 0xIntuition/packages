import type { PredicateSpec } from '../../types.js';

export const compatibleWith = {
	key: 'compatibleWith',
	name: 'compatible with',
	description:
		'The subject works correctly or interoperates with the object system, standard, or platform',
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Domain-Specific',
	status: 'proposed',
	isSymmetric: true,
} as const satisfies PredicateSpec;
