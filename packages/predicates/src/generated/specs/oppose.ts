import type { PredicateSpec } from '../../types.js';

export const oppose = {
	key: 'oppose',
	name: 'oppose',
	description:
		"The subject actively resists or campaigns against the object cause, proposal, or initiative. The inverse of 'supports'",
	marketPattern: 'depositional',
	conjugates: true,
	thirdPerson: 'opposes',
	category: 'Sentiment/Opinion',
	status: 'proposed',
} as const satisfies PredicateSpec;
