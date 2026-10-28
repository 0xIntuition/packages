import type { PredicateSpec } from '../../types.js';

export const hasType = {
	key: 'hasType',
	name: 'has type',
	// Identity-sensitive: this text is part of the minted predicate atom data. Keep the
	// bytes frozen; reword guidance in docs, not here (see docs/reconciliation.md).
	description:
		"Classifies the subject under a type or category atom. More specific than 'is' — use when asserting formal classification rather than loose identity",
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Identity/Classification',
	status: 'enshrined',
	examples: ['(Uniswap, has type, Decentralized Exchange)', '(Ethereum, has type, Blockchain)'],
	objectKind: 'entity',
	temporalNature: 'permanent',
	claimType: 'factual',
} as const satisfies PredicateSpec;
