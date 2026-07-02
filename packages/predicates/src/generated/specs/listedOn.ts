import type { PredicateSpec } from '../../types.js';

export const listedOn = {
	key: 'listedOn',
	name: 'listed on',
	description:
		'The subject asset or product is available for trading or purchase on the object exchange or marketplace',
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Economic/Market',
	status: 'proposed',
	objectKind: 'entity',
	temporalNature: 'state',
	claimType: 'factual',
} as const satisfies PredicateSpec;
