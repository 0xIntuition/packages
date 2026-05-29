import type { PredicateSpec } from '../../types.js';

export const certifiedBy = {
	key: 'certifiedBy',
	name: 'certified by',
	description:
		'The subject holds a credential, certification, or formal recognition issued by the object authority',
	marketPattern: 'depositional',
	conjugates: false,
	category: 'Knowledge/Expertise',
	status: 'proposed',
} as const satisfies PredicateSpec;
