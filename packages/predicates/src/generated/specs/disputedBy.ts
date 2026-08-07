import type { PredicateSpec } from '../../types.js';

export const disputedBy = {
	key: 'disputedBy',
	name: 'disputed by',
	description:
		'The subject claim is challenged or contradicted by the object counter-evidence or actor',
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Provenance/Evidence',
	status: 'proposed',
	objectKind: 'claim',
	temporalNature: 'permanent',
	claimType: 'factual',
} as const satisfies PredicateSpec;
