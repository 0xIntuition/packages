import type { PredicateSpec } from '../../types.js';

export const pricedIn = {
	key: 'pricedIn',
	name: 'priced in',
	description:
		'The subject asset or service is denominated or quoted in the object currency or token',
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Domain-Specific',
	status: 'proposed',
	objectKind: 'entity',
	temporalNature: 'state',
	claimType: 'factual',
} as const satisfies PredicateSpec;
