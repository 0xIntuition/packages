import type { PredicateSpec } from '../../types.js';

export const softwareAddOn = {
	key: 'softwareAddOn',
	name: 'software add on',
	description:
		'The subject software application supports the object software application as an add-on',
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Domain-Specific',
	status: 'proposed',
} as const satisfies PredicateSpec;
