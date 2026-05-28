import type { PredicateSpec } from '../../types.js';

export const sameAs = {
	key: 'sameAs',
	name: 'same as',
	description:
		'Declares that the subject and object refer to the same real-world entity across representations, naming systems, or aliases. Symmetric and transitive — use for identity resolution, duplicate collapsing, and alternate-name mapping',
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Identity/Classification',
	status: 'enshrined',
	examples: ['(ETH, same as, Ether)', '(vitalik.eth, same as, Vitalik Buterin)'],
	isTransitive: true,
	isSymmetric: true,
	inversePredicate: 'same as',
} as const satisfies PredicateSpec;
