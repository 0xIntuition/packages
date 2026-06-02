import type { PredicateSpec } from '../../types.js';

export const partOfSeries = {
	key: 'partOfSeries',
	name: 'part of series',
	description: 'The subject episode or creative work belongs to the object series',
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Curation/Containment',
	status: 'proposed',
	relationships: {
		'podcast-episode': {
			direction: 'out',
			expectedObjectTypes: ['podcast-series'],
			schemaOrgProperty: 'partOfSeries',
		},
	},
} as const satisfies PredicateSpec;
