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
	relationships: {
		article: {
			direction: 'out',
			expectedObjectTypes: ['person', 'company'],
			schemaOrgProperty: 'publisher',
		},
		book: {
			direction: 'out',
			expectedObjectTypes: ['person', 'company'],
			schemaOrgProperty: 'publisher',
		},
		dataset: {
			direction: 'out',
			expectedObjectTypes: ['person', 'company'],
			schemaOrgProperty: 'publisher',
		},
		'news-article': {
			direction: 'out',
			expectedObjectTypes: ['person', 'company'],
			schemaOrgProperty: 'publisher',
		},
		'podcast-series': {
			direction: 'out',
			expectedObjectTypes: ['person', 'company'],
			schemaOrgProperty: 'publisher',
		},
		'web-site': {
			direction: 'out',
			expectedObjectTypes: ['person', 'company'],
			schemaOrgProperty: 'publisher',
		},
	},
} as const satisfies PredicateSpec;
