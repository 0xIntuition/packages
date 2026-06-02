import type { PredicateSpec } from '../../types.js';

export const brand = {
	key: 'brand',
	name: 'brand',
	description: 'The subject product, service, or organization is associated with the object brand',
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Identity/Classification',
	status: 'proposed',
} as const satisfies PredicateSpec;
