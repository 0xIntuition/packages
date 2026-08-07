import type { PredicateSpec } from '../../types.js';

export const bullishOn = {
	key: 'bullishOn',
	name: 'bullish on',
	description:
		"The subject has positive conviction about the object's future value, growth, or success. A market-native sentiment primitive",
	marketPattern: 'depositional',
	conjugates: false,
	category: 'Sentiment/Opinion',
	status: 'enshrined',
	objectKind: 'entity',
	polarity: 'positive',
	temporalNature: 'state',
	claimType: 'evaluative',
	contradicts: ['bearishOn'],
} as const satisfies PredicateSpec;
