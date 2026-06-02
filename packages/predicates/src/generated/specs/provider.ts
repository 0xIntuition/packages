import type { PredicateSpec } from '../../types.js';

export const provider = {
	key: 'provider',
	name: 'provider',
	description:
		'The subject service, software, or creative work is provided by the object person or organization',
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Metadata/Linking',
	status: 'proposed',
} as const satisfies PredicateSpec;
