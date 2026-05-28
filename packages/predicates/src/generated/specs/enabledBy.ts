import type { PredicateSpec } from '../../types.js';

export const enabledBy = {
	key: 'enabledBy',
	name: 'enabled by',
	description:
		'The subject outcome was made possible by the object precondition, innovation, or actor',
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Temporal/Lifecycle',
	status: 'proposed',
} as const satisfies PredicateSpec;
