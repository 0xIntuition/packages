import type { PredicateSpec } from '../../types.js';

export const confirmedBy = {
	key: 'confirmedBy',
	name: 'confirmed by',
	description: 'The subject claim is independently corroborated by the object source or evidence',
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Provenance/Evidence',
	status: 'proposed',
} as const satisfies PredicateSpec;
