import type { PredicateSpec } from '../../types.js';

export const followedBy = {
	key: 'followedBy',
	name: 'followed by',
	// Identity-sensitive: this text is part of the minted predicate atom data. Keep the
	// bytes frozen; reword guidance in docs, not here (see docs/reconciliation.md).
	description:
		"The subject event or state is immediately followed by the object event or state. The inverse of 'preceded by'",
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
