import type { PredicateSpec } from '../../types.js';

export const replacedBy = {
	key: 'replacedBy',
	name: 'replaced by',
	description:
		"The subject has been fully substituted by the object. Stronger than 'deprecated by' — implies the subject is no longer active",
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Temporal/Lifecycle',
	status: 'proposed',
	objectKind: 'entity',
	temporalNature: 'permanent',
	claimType: 'factual',
} as const satisfies PredicateSpec;
