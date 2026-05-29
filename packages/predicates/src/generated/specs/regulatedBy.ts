import type { PredicateSpec } from '../../types.js';

export const regulatedBy = {
	key: 'regulatedBy',
	name: 'regulated by',
	description:
		'The subject entity falls under the regulatory authority or jurisdiction of the object body',
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Governance/Policy',
	status: 'proposed',
} as const satisfies PredicateSpec;
