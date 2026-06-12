import type { PredicateSpec } from '../../types.js';

export const partOfSeries = {
	key: 'partOfSeries',
	name: 'part of series',
	description: 'The subject episode or creative work belongs to the object series',
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Curation/Containment',
	status: 'proposed',
} as const satisfies PredicateSpec;
