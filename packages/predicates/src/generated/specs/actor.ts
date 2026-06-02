import type { PredicateSpec } from '../../types.js';

export const actor = {
	key: 'actor',
	name: 'actor',
	description: 'The subject creative work features the object actor or performing group',
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Authorship/Contribution',
	status: 'proposed',
	relationships: {
		movie: {
			direction: 'out',
			expectedObjectTypes: ['person', 'music-group'],
			schemaOrgProperty: 'actor',
		},
		'podcast-episode': {
			direction: 'out',
			expectedObjectTypes: ['person', 'music-group'],
			schemaOrgProperty: 'actor',
		},
		'podcast-series': {
			direction: 'out',
			expectedObjectTypes: ['person', 'music-group'],
			schemaOrgProperty: 'actor',
		},
		'tv-series': {
			direction: 'out',
			expectedObjectTypes: ['person', 'music-group'],
			schemaOrgProperty: 'actor',
		},
		'video-object': {
			direction: 'out',
			expectedObjectTypes: ['person', 'music-group'],
			schemaOrgProperty: 'actor',
		},
	},
} as const satisfies PredicateSpec;
