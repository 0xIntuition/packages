import type { PredicateSpec } from '../../types.js';

export const support = {
	key: 'support',
	name: 'support',
	description:
		"The subject actively backs the object cause, proposal, or initiative. Broader than 'endorses' — applies to movements and policies, not just entities",
	marketPattern: 'depositional',
	conjugates: true,
	thirdPerson: 'supports',
	category: 'Sentiment/Opinion',
	status: 'proposed',
} as const satisfies PredicateSpec;
