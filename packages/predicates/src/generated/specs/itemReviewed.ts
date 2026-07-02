import type { PredicateSpec } from '../../types.js';

export const itemReviewed = {
	key: 'itemReviewed',
	name: 'item reviewed',
	description: 'The subject review or aggregate rating evaluates the object item',
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Social/Reputation',
	status: 'proposed',
	objectKind: 'entity',
	temporalNature: 'permanent',
	claimType: 'factual',
} as const satisfies PredicateSpec;
