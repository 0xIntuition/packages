import type { PredicateSpec } from '../../types.js';

export const neutralOn = {
	key: 'neutralOn',
	name: 'neutral on',
	description:
		"The subject records an explicit non-position on the object. Useful for distinguishing 'no opinion expressed' from 'consciously neutral'",
	marketPattern: 'depositional',
	conjugates: false,
	category: 'Sentiment/Opinion',
	status: 'proposed',
} as const satisfies PredicateSpec;
