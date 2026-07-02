import type { PredicateSpec } from '../../types.js';

export const hasCategory = {
	key: 'hasCategory',
	name: 'has category',
	description:
		'Places the subject in a product-level browsable category for user-facing discovery and filtering. Less formal than `has type` (which asserts a taxonomy classification) and more curated than `has tag` (which is free-form)',
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Identity/Classification',
	status: 'enshrined',
	examples: ['(Uniswap, has category, DeFi)', '(Aave, has category, Lending)'],
	objectKind: 'entity',
	temporalNature: 'permanent',
	claimType: 'factual',
} as const satisfies PredicateSpec;
