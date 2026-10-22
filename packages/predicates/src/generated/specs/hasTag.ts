import type { PredicateSpec } from '../../types.js';

export const hasTag = {
	key: 'hasTag',
	name: 'has tag',
	// Identity-sensitive: this text is part of the minted predicate atom data. Keep the
	// bytes frozen; reword guidance in docs, not here (see docs/reconciliation.md).
	description:
		'Assigns a reusable tag or keyword atom to the subject for filtering, clustering, and discovery',
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Identity/Classification',
	status: 'enshrined',
	examples: ['(ETHGlobal, has tag, hackathon)', '(Rust, has tag, systems-programming)'],
	objectKind: 'entity',
	temporalNature: 'permanent',
	claimType: 'factual',
} as const satisfies PredicateSpec;
