import type { PredicateSpec } from '../../types.js';

export const alternativeTo = {
	key: 'alternativeTo',
	name: 'alternative to',
	description: 'The subject can serve as a substitute or competing option for the object',
	marketPattern: 'comparative',
	conjugates: false,
	category: 'Curation/Containment',
	status: 'enshrined',
	isSymmetric: true,
} as const satisfies PredicateSpec;
