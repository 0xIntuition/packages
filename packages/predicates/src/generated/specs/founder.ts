import type { PredicateSpec } from '../../types.js';

export const founder = {
	key: 'founder',
	name: 'founder',
	description:
		'The subject organization or business was founded by the object person or organization',
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Affiliation/Membership',
	status: 'proposed',
	relationships: {
		company: {
			direction: 'out',
			expectedObjectTypes: ['person', 'company'],
			schemaOrgProperty: 'founder',
		},
		'local-business': {
			direction: 'out',
			expectedObjectTypes: ['person', 'company'],
			schemaOrgProperty: 'founder',
		},
		'music-group': {
			direction: 'out',
			expectedObjectTypes: ['person', 'company'],
			schemaOrgProperty: 'founder',
		},
	},
} as const satisfies PredicateSpec;
