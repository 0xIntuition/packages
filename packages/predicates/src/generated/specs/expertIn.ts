import type { PredicateSpec } from '../../types.js';

export const expertIn = {
	key: 'expertIn',
	name: 'expert in',
	description:
		'The subject claims or is recognized as having deep expertise in the object domain or skill',
	marketPattern: 'depositional',
	conjugates: false,
	category: 'Knowledge/Expertise',
	status: 'proposed',
} as const satisfies PredicateSpec;
