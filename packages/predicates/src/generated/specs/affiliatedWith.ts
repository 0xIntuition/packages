import type { PredicateSpec } from '../../types.js';

export const affiliatedWith = {
	key: 'affiliatedWith',
	name: 'affiliated with',
	description:
		'A general association between the subject and object entities without implying employment or membership',
	marketPattern: 'depositional',
	conjugates: false,
	category: 'Affiliation/Membership',
	status: 'proposed',
	isSymmetric: true,
	objectKind: 'entity',
	temporalNature: 'state',
	claimType: 'factual',
} as const satisfies PredicateSpec;
