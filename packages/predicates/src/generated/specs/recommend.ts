import type { PredicateSpec } from '../../types.js';

export const recommend = {
	key: 'recommend',
	name: 'recommend',
	description:
		"The subject actively recommends the object to others in the ecosystem. Stronger than 'likes', weaker than 'endorses'",
	marketPattern: 'depositional',
	conjugates: true,
	thirdPerson: 'recommends',
	category: 'Social/Reputation',
	status: 'enshrined',
	objectKind: 'entity',
	polarity: 'positive',
	temporalNature: 'state',
	claimType: 'evaluative',
} as const satisfies PredicateSpec;
