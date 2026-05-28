import type { PredicateSpec } from '../../types.js';

export const delegatedTo = {
	key: 'delegatedTo',
	name: 'delegated to',
	description:
		'The subject has delegated governance power, voting rights, or authority to the object actor',
	marketPattern: 'depositional',
	conjugates: false,
	category: 'Governance/Policy',
	status: 'proposed',
} as const satisfies PredicateSpec;
