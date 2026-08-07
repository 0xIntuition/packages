import type { PredicateSpec } from '../../types.js';

export const endorse = {
	key: 'endorse',
	name: 'endorse',
	description:
		"A stronger-than-like signal indicating the subject publicly supports or vouches for the object's quality or legitimacy",
	marketPattern: 'depositional',
	conjugates: true,
	thirdPerson: 'endorses',
	category: 'Social/Reputation',
	status: 'enshrined',
	objectKind: 'entity',
	polarity: 'positive',
	temporalNature: 'state',
	claimType: 'evaluative',
	specializes: ['support'],
} as const satisfies PredicateSpec;
