import type { PredicateSpec } from '../../types.js';

export const availableOn = {
	key: 'availableOn',
	name: 'available on',
	description:
		'Indicates the subject can be accessed, purchased, or used on the object platform or chain',
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Metadata/Linking',
	status: 'proposed',
} as const satisfies PredicateSpec;
