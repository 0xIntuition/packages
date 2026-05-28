import type { PredicateSpec } from '../../types.js';

export const votedAgainst = {
	key: 'votedAgainst',
	name: 'voted against',
	description: 'The subject cast a governance vote opposing the object proposal',
	marketPattern: 'depositional',
	conjugates: false,
	category: 'Governance/Policy',
	status: 'proposed',
} as const satisfies PredicateSpec;
