import type { PredicateSpec } from '../../types.js';

export const compliantWith = {
	key: 'compliantWith',
	name: 'compliant with',
	description:
		'The subject entity meets the requirements defined by the object regulation, standard, or framework',
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Governance/Policy',
	status: 'proposed',
	objectKind: 'entity',
	temporalNature: 'state',
	claimType: 'factual',
} as const satisfies PredicateSpec;
