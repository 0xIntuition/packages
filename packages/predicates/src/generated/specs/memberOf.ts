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
} as const satisfies PredicateSpec;
