import type { PredicateSpec } from '../../types.js';

export const distrust = {
	key: 'distrust',
	name: 'distrust',
	description:
		"The subject asserts negative trust in the object. The inverse of 'trusts' — enables negative reputation signals",
	marketPattern: 'depositional',
	conjugates: true,
	thirdPerson: 'distrusts',
	category: 'Social/Reputation',
	status: 'enshrined',
	objectKind: 'entity',
	polarity: 'negative',
	temporalNature: 'state',
	claimType: 'evaluative',
	contradicts: ['trust'],
} as const satisfies PredicateSpec;
