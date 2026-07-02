import type { PredicateSpec } from '../../types.js';

export const follow = {
	key: 'follow',
	name: 'follow',
	description:
		'The subject chooses to subscribe to or track updates from the object entity. Unidirectional and non-reciprocal',
	marketPattern: 'depositional',
	conjugates: true,
	thirdPerson: 'follows',
	category: 'Social/Reputation',
	status: 'enshrined',
	objectKind: 'entity',
	temporalNature: 'state',
	claimType: 'factual',
} as const satisfies PredicateSpec;
