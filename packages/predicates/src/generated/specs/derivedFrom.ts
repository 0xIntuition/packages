import type { PredicateSpec } from '../../types.js';

export const derivedFrom = {
	key: 'derivedFrom',
	name: 'derived from',
	description: 'The subject was produced by transforming, adapting, or building upon the object',
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Authorship/Contribution',
	status: 'proposed',
	objectKind: 'entity',
	temporalNature: 'permanent',
	claimType: 'factual',
} as const satisfies PredicateSpec;
