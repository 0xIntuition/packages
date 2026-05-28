import type { PredicateSpec } from '../../types.js';

export const hasDescription = {
	key: 'hasDescription',
	name: 'has description',
	description: 'Attaches a textual description atom to the subject entity',
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Metadata/Linking',
	status: 'enshrined',
} as const satisfies PredicateSpec;
