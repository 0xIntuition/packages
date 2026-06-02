import type { PredicateSpec } from '../../types.js';

export const musicGroupMember = {
	key: 'musicGroupMember',
	name: 'music group member',
	description: 'The subject music group includes the object person as a member',
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Affiliation/Membership',
	status: 'proposed',
	isHierarchical: true,
} as const satisfies PredicateSpec;
