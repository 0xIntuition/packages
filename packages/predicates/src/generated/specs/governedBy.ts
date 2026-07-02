import type { PredicateSpec } from '../../types.js';

export const governedBy = {
	key: 'governedBy',
	name: 'governed by',
	description:
		'The subject protocol, contract, or entity is under the governance authority of the object',
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Domain-Specific',
	status: 'proposed',
	objectKind: 'entity',
	temporalNature: 'state',
	claimType: 'factual',
} as const satisfies PredicateSpec;
