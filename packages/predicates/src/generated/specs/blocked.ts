import type { PredicateSpec } from '../../types.js';

export const blocked = {
	key: 'blocked',
	name: 'blocked',
	description: 'The subject has chosen to exclude the object from their view or interactions',
	marketPattern: 'depositional',
	conjugates: false,
	category: 'Social/Reputation',
	status: 'proposed',
} as const satisfies PredicateSpec;
