import type { PredicateSpec } from '../../types.js';

export const implement = {
	key: 'implement',
	name: 'implement',
	description:
		'The subject contract, application, or system implements the object standard, specification, or interface',
	marketPattern: 'attributive',
	conjugates: true,
	thirdPerson: 'implements',
	category: 'Domain-Specific',
	status: 'proposed',
} as const satisfies PredicateSpec;
