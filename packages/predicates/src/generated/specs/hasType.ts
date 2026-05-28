import type { PredicateSpec } from '../../types.js';

export const hasType = {
	key: 'hasType',
	name: 'has type',
	description:
		'Classifies the subject under a formal taxonomy or defined-term object. Use when the object is a structured classification term (e.g., a schema.org type or enshrined defined-term), not a free-form label',
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Identity/Classification',
	status: 'enshrined',
	examples: ['(Uniswap, has type, Decentralized Exchange)', '(Ethereum, has type, Blockchain)'],
} as const satisfies PredicateSpec;
