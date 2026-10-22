import type { PredicateSpec } from '../../types.js';

export const sameAs = {
	key: 'sameAs',
	name: 'same as',
	// Identity-sensitive: this text is part of the minted predicate atom data. Keep the
	// bytes frozen; reword guidance in docs, not here (see docs/reconciliation.md).
	description:
		'Declares that the subject and object refer to the same real-world entity across different representations or naming systems',
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Identity/Classification',
	status: 'enshrined',
	examples: ['(ETH, same as, Ether)', '(vitalik.eth, same as, Vitalik Buterin)'],
	isTransitive: true,
	isSymmetric: true,
	inversePredicate: 'same as',
	objectKind: 'entity',
	temporalNature: 'permanent',
	claimType: 'factual',
} as const satisfies PredicateSpec;
