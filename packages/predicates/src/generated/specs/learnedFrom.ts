import type { PredicateSpec } from '../../types.js';

export const learnedFrom = {
	key: 'learnedFrom',
	name: 'learned from',
	description:
		'The subject acquired knowledge or skills from the object actor or resource. A directed knowledge-attribution edge',
	marketPattern: 'depositional',
	conjugates: false,
	category: 'Knowledge/Expertise',
	status: 'proposed',
} as const satisfies PredicateSpec;
