import type { PredicateSpec } from '../../types.js';

export const proposed = {
	key: 'proposed',
	name: 'proposed',
	description:
		'The subject actor authored or submitted the object proposal for governance consideration',
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Governance/Policy',
	status: 'proposed',
} as const satisfies PredicateSpec;
