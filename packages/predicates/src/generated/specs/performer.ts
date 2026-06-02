import type { PredicateSpec } from '../../types.js';

export const performer = {
	key: 'performer',
	name: 'performer',
	description: 'The subject event or creative work includes the object performer',
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Authorship/Contribution',
	status: 'proposed',
	relationships: {
		event: {
			direction: 'out',
			expectedObjectTypes: ['person', 'company', 'music-group'],
			schemaOrgProperty: 'performer',
		},
	},
} as const satisfies PredicateSpec;
