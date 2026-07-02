import type { PredicateSpec } from '../../types.js';

export const deprecatedBy = {
	key: 'deprecatedBy',
	name: 'deprecated by',
	description:
		'The subject is formally deprecated in favor of the object replacement. The subject still exists but is no longer recommended',
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Temporal/Lifecycle',
	status: 'proposed',
	objectKind: 'entity',
	temporalNature: 'permanent',
	claimType: 'factual',
} as const satisfies PredicateSpec;
