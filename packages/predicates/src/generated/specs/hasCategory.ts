import type { PredicateSpec } from '../../types.js';

export const hasCategory = {
	key: 'hasCategory',
	name: 'has category',
	// Identity-sensitive: this text is part of the minted predicate atom data. Keep the
	// bytes frozen; reword guidance in docs, not here (see docs/reconciliation.md).
	description:
		'Places the subject within a broader categorical grouping. More formal than tags — use for structured taxonomies rather than free-form labeling',
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Identity/Classification',
	status: 'enshrined',
	examples: ['(Uniswap, has category, DeFi)', '(Aave, has category, Lending)'],
	objectKind: 'entity',
	temporalNature: 'permanent',
	claimType: 'factual',
} as const satisfies PredicateSpec;
