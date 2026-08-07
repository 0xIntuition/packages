import type { PredicateSpec } from '../../types.js';

export const precededBy = {
	key: 'precededBy',
	name: 'preceded by',
	description:
		'The subject event or state was preceded by the object event or state in a temporal sequence',
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Temporal/Lifecycle',
	status: 'proposed',
	isTransitive: true,
	inversePredicate: 'followed by',
	objectKind: 'entity',
	temporalNature: 'permanent',
	claimType: 'factual',
	inverse: 'followedBy',
} as const satisfies PredicateSpec;
