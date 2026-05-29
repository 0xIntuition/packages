import type { PredicateSpec } from '../../types.js';

export const authoredBy = {
	key: 'authoredBy',
	name: 'authored by',
	description: 'The subject content was written or composed by the object actor',
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Authorship/Contribution',
	status: 'proposed',
} as const satisfies PredicateSpec;
