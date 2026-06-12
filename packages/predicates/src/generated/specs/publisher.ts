import type { PredicateSpec } from '../../types.js';

export const publisher = {
	key: 'publisher',
	name: 'publisher',
	description:
		'The subject creative work or dataset was published by the object person or organization',
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Authorship/Contribution',
	status: 'proposed',
} as const satisfies PredicateSpec;
