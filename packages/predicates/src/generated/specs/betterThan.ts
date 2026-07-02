import type { PredicateSpec } from '../../types.js';

export const betterThan = {
	key: 'betterThan',
	name: 'better than',
	description:
		'The subject is asserted as subjectively superior to the object. Opinion-grade — the triple captures a claim, not an objective fact',
	marketPattern: 'comparative',
	conjugates: false,
	category: 'Comparison/Ranking',
	status: 'enshrined',
	objectKind: 'entity',
	temporalNature: 'permanent',
	claimType: 'evaluative',
	contradicts: ['worseThan'],
} as const satisfies PredicateSpec;
