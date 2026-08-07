import type { PredicateSpec } from '../../types.js';

export const competeWith = {
	key: 'competeWith',
	name: 'compete with',
	description: 'The subject and object are direct competitors in the same market or category',
	marketPattern: 'comparative',
	conjugates: true,
	thirdPerson: 'competes with',
	category: 'Comparison/Ranking',
	status: 'proposed',
	isSymmetric: true,
	objectKind: 'entity',
	temporalNature: 'permanent',
	claimType: 'factual',
} as const satisfies PredicateSpec;
