import type { PredicateSpec } from '../../types.js';

export const studied = {
	key: 'studied',
	name: 'studied',
	description:
		'The subject has invested learning effort in the object domain, topic, or institution',
	marketPattern: 'depositional',
	conjugates: false,
	category: 'Knowledge/Expertise',
	status: 'proposed',
} as const satisfies PredicateSpec;
