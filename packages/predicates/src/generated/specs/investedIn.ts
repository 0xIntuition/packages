import type { PredicateSpec } from '../../types.js';

export const investedIn = {
	key: 'investedIn',
	name: 'invested in',
	description: 'The subject has made a financial or resource investment in the object entity',
	marketPattern: 'depositional',
	conjugates: false,
	category: 'Affiliation/Membership',
	status: 'proposed',
	objectKind: 'entity',
	temporalNature: 'state',
	claimType: 'factual',
} as const satisfies PredicateSpec;
