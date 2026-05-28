import type { PredicateSpec } from '../../types.js';

export const createdBy = {
	key: 'createdBy',
	name: 'created by',
	description: 'The subject was originally created or brought into existence by the object actor',
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Authorship/Contribution',
	status: 'enshrined',
} as const satisfies PredicateSpec;
