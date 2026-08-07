import type { PredicateSpec } from '../../types.js';

export const triggered = {
	key: 'triggered',
	name: 'triggered',
	description:
		'The subject event or action directly caused the object consequence or chain of events',
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Temporal/Lifecycle',
	status: 'proposed',
	objectKind: 'entity',
	temporalNature: 'event',
	claimType: 'factual',
} as const satisfies PredicateSpec;
