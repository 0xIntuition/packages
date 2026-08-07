import type { PredicateSpec } from '../../types.js';

export const bearishOn = {
	key: 'bearishOn',
	name: 'bearish on',
	description:
		"The subject has negative conviction about the object's future value, growth, or success. The inverse of 'bullish on'",
	marketPattern: 'depositional',
	conjugates: false,
	category: 'Sentiment/Opinion',
	status: 'enshrined',
	objectKind: 'entity',
	polarity: 'negative',
	temporalNature: 'state',
	claimType: 'evaluative',
	contradicts: ['bullishOn'],
} as const satisfies PredicateSpec;
