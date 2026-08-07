import type { PredicateSpec } from '../../types.js';

export const skepticalOf = {
	key: 'skepticalOf',
	name: 'skeptical of',
	description:
		"The subject expresses cautious doubt about the object without fully rejecting it. Weaker than 'distrusts' or 'opposes'",
	marketPattern: 'depositional',
	conjugates: false,
	category: 'Sentiment/Opinion',
	status: 'proposed',
	objectKind: 'entity',
	polarity: 'negative',
	temporalNature: 'state',
	claimType: 'evaluative',
} as const satisfies PredicateSpec;
