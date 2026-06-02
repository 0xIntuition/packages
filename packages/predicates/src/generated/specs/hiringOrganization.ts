import type { PredicateSpec } from '../../types.js';

export const hiringOrganization = {
	key: 'hiringOrganization',
	name: 'hiring organization',
	description: 'The subject job posting is offered by the object hiring organization',
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Affiliation/Membership',
	status: 'proposed',
	relationships: {
		'job-posting': {
			direction: 'out',
			expectedObjectTypes: ['company'],
			schemaOrgProperty: 'hiringOrganization',
		},
	},
} as const satisfies PredicateSpec;
