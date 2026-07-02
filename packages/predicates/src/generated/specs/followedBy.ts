import type { PredicateSpec } from '../../types.js';

export const followedBy = {
	key: 'followedBy',
	name: 'followed by',
	description:
		"The subject event or state is followed by the object event or state. The inverse of 'preceded by'",
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Temporal/Lifecycle',
	status: 'proposed',
	isTransitive: true,
	inversePredicate: 'preceded by',
	objectKind: 'entity',
	temporalNature: 'permanent',
	claimType: 'factual',
	inverse: 'precededBy',
} as const satisfies PredicateSpec;
