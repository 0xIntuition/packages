import type { PredicateSpec } from '../../types.js';

export const trust = {
	key: 'trust',
	name: 'trust',
	description:
		'The subject asserts positive trust in the object. A first-class reputation primitive for web-of-trust graphs',
	marketPattern: 'depositional',
	conjugates: true,
	thirdPerson: 'trusts',
	category: 'Social/Reputation',
	status: 'enshrined',
} as const satisfies PredicateSpec;
