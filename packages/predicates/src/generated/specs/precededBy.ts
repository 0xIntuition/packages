import type { PredicateSpec } from '../../types.js';

export const precededBy = {
	key: 'precededBy',
	name: 'preceded by',
	// Identity-sensitive: this text is part of the minted predicate atom data. Keep the
	// bytes frozen; reword guidance in docs, not here (see docs/reconciliation.md).
	description:
		'The subject event or state was immediately preceded by the object event or state in a temporal sequence',
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
