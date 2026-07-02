import type { PredicateSpec } from '../../types.js';

export const backedBy = {
	key: 'backedBy',
	name: 'backed by',
	description:
		'The subject asset or instrument is collateralized, guaranteed, or underwritten by the object asset or entity',
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Economic/Market',
	status: 'proposed',
	objectKind: 'entity',
	polarity: 'positive',
	temporalNature: 'state',
	claimType: 'factual',
} as const satisfies PredicateSpec;
