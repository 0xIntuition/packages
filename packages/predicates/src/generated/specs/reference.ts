import type { PredicateSpec } from '../../types.js';

export const reference = {
	key: 'reference',
	name: 'reference',
	description:
		"The subject work cites or refers to the object work. A forward citation link — the inverse of 'cited by'",
	marketPattern: 'attributive',
	conjugates: true,
	thirdPerson: 'references',
	category: 'Provenance/Evidence',
	status: 'proposed',
	inversePredicate: 'cited by',
	objectKind: 'entity',
	temporalNature: 'permanent',
	claimType: 'factual',
	inverse: 'citedBy',
} as const satisfies PredicateSpec;
