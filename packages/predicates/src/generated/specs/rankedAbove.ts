import type { PredicateSpec } from '../../types.js';

export const rankedAbove = {
	key: 'rankedAbove',
	name: 'ranked above',
	description:
		'The subject is explicitly ranked higher than the object within a shared ordering context',
	marketPattern: 'comparative',
	conjugates: false,
	category: 'Curation/Containment',
	status: 'proposed',
	objectKind: 'entity',
	temporalNature: 'permanent',
	claimType: 'evaluative',
} as const satisfies PredicateSpec;
