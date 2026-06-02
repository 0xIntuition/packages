import type { PredicateSpec } from '../../types.js';

export const areaServed = {
	key: 'areaServed',
	name: 'area served',
	description: 'The subject service or organization serves the object place or region',
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Metadata/Linking',
	status: 'proposed',
} as const satisfies PredicateSpec;
