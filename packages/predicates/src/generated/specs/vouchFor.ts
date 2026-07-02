import type { PredicateSpec } from '../../types.js';

export const vouchFor = {
	key: 'vouchFor',
	name: 'vouch for',
	description:
		"The subject stakes personal credibility on the object's identity, quality, or claims. A reputation primitive stronger than endorsement",
	marketPattern: 'depositional',
	conjugates: true,
	thirdPerson: 'vouches for',
	category: 'Social/Reputation',
	status: 'enshrined',
	objectKind: 'entity',
	polarity: 'positive',
	temporalNature: 'state',
	claimType: 'evaluative',
	specializes: ['support'],
} as const satisfies PredicateSpec;
