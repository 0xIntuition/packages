import type { PredicateSpec } from '../../types.js';

export const hiringOrganization = {
	key: 'hiringOrganization',
	name: 'hiring organization',
	description: 'The subject job posting is offered by the object hiring organization',
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Affiliation/Membership',
	status: 'proposed',
	objectKind: 'entity',
	temporalNature: 'state',
	claimType: 'factual',
} as const satisfies PredicateSpec;
