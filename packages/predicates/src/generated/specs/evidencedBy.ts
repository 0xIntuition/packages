import type { PredicateSpec } from '../../types.js';

export const evidencedBy = {
	key: 'evidencedBy',
	name: 'evidenced by',
	description: 'The subject claim is supported by the object proof, data, or artifact',
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Provenance/Evidence',
	status: 'proposed',
} as const satisfies PredicateSpec;
