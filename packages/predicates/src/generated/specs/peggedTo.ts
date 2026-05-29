import type { PredicateSpec } from '../../types.js';

export const peggedTo = {
	key: 'peggedTo',
	name: 'pegged to',
	description:
		'The subject asset maintains a target price ratio relative to the object reference asset',
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Economic/Market',
	status: 'proposed',
} as const satisfies PredicateSpec;
