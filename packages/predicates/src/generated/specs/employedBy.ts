import type { PredicateSpec } from '../../types.js';

export const employedBy = {
	key: 'employedBy',
	name: 'employed by',
	description: 'The subject person is employed by the object organization',
	marketPattern: 'depositional',
	conjugates: false,
	category: 'Affiliation/Membership',
	status: 'proposed',
	objectKind: 'entity',
	temporalNature: 'state',
	claimType: 'factual',
	specializes: ['affiliatedWith'],
} as const satisfies PredicateSpec;
