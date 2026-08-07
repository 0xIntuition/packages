import type { PredicateSpec } from '../../types.js';

export const verifiedBy = {
	key: 'verifiedBy',
	name: 'verified by',
	description:
		'The subject has been independently verified or validated by the object authority or process',
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Provenance/Evidence',
	status: 'proposed',
	objectKind: 'claim',
	temporalNature: 'permanent',
	claimType: 'factual',
} as const satisfies PredicateSpec;
