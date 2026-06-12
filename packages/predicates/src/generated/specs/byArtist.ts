import type { PredicateSpec } from '../../types.js';

export const byArtist = {
	key: 'byArtist',
	name: 'by artist',
	description: 'The subject music work was created or performed by the object artist',
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Authorship/Contribution',
	status: 'proposed',
} as const satisfies PredicateSpec;
