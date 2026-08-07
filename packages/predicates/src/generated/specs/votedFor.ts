import type { PredicateSpec } from '../../types.js';

export const votedFor = {
	key: 'votedFor',
	name: 'voted for',
	description: 'The subject cast a governance vote in favor of the object proposal',
	marketPattern: 'depositional',
	conjugates: false,
	category: 'Governance/Policy',
	status: 'proposed',
	objectKind: 'entity',
	polarity: 'positive',
	temporalNature: 'event',
	claimType: 'factual',
	contradicts: ['votedAgainst'],
} as const satisfies PredicateSpec;
