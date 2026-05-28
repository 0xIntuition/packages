import type { PredicateSpec } from '../../types.js';

export const like = {
	key: 'like',
	name: 'like',
	description: 'Expresses lightweight positive endorsement of the object by the subject',
	marketPattern: 'depositional',
	conjugates: true,
	thirdPerson: 'likes',
	category: 'Social/Reputation',
	status: 'enshrined',
} as const satisfies PredicateSpec;
