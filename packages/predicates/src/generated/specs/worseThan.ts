import type { PredicateSpec } from '../../types.js';

export const worseThan = {
	key: 'worseThan',
	name: 'worse than',
	description:
		"The subject is asserted as subjectively inferior to the object. The inverse of 'better than'",
	marketPattern: 'comparative',
	conjugates: false,
	category: 'Comparison/Ranking',
	status: 'proposed',
	objectKind: 'entity',
	temporalNature: 'permanent',
	claimType: 'evaluative',
	contradicts: ['betterThan'],
} as const satisfies PredicateSpec;
