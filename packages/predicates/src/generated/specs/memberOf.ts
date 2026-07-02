import type { PredicateSpec } from '../../types.js';

export const memberOf = {
	key: 'memberOf',
	name: 'member of',
	description: 'The subject actor or entity holds membership in the object organization or group',
	marketPattern: 'depositional',
	conjugates: false,
	category: 'Affiliation/Membership',
	status: 'proposed',
	isHierarchical: true,
	objectKind: 'entity',
	temporalNature: 'state',
	claimType: 'factual',
	specializes: ['affiliatedWith'],
} as const satisfies PredicateSpec;
