import type { PredicateSpec } from '../../types.js';

export const brand = {
	key: 'brand',
	name: 'brand',
	description: 'The subject product, service, or organization is associated with the object brand',
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Identity/Classification',
	status: 'proposed',
	examples: ['(iPhone, brand, Apple)', '(AWS, brand, Amazon Web Services)'],
} as const satisfies PredicateSpec;
