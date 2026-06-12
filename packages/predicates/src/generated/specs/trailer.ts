import type { PredicateSpec } from '../../types.js';

export const trailer = {
	key: 'trailer',
	name: 'trailer',
	description: 'The subject media work has the object video as its trailer',
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Metadata/Linking',
	status: 'proposed',
} as const satisfies PredicateSpec;
