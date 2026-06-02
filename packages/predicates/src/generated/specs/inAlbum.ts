import type { PredicateSpec } from '../../types.js';

export const inAlbum = {
	key: 'inAlbum',
	name: 'in album',
	description: 'The subject music recording appears on the object music album',
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Curation/Containment',
	status: 'proposed',
} as const satisfies PredicateSpec;
