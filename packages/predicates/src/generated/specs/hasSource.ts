import type { PredicateSpec } from '../../types.js';

export const hasSource = {
	key: 'hasSource',
	name: 'has source',
	description: 'Points to the authoritative origin or reference material for the subject',
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Metadata/Linking',
	status: 'proposed',
} as const satisfies PredicateSpec;
