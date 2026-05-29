import type { PredicateSpec } from '../../types.js';

export const attestedBy = {
	key: 'attestedBy',
	name: 'attested by',
	description: 'The subject claim or credential is witnessed and signed by the object attestor',
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Provenance/Evidence',
	status: 'proposed',
} as const satisfies PredicateSpec;
