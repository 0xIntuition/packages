import type { PredicateSpec } from '../../types.js';

export const contributedTo = {
	key: 'contributedTo',
	name: 'contributed to',
	description:
		'The subject actor made a meaningful contribution to the object project, work, or entity',
	marketPattern: 'depositional',
	conjugates: false,
	category: 'Authorship/Contribution',
	status: 'proposed',
} as const satisfies PredicateSpec;
