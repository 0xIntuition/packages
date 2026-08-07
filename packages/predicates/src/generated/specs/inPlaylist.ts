import type { PredicateSpec } from '../../types.js';

export const inPlaylist = {
	key: 'inPlaylist',
	name: 'in playlist',
	description: 'The subject music recording appears in the object music playlist',
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Curation/Containment',
	status: 'proposed',
	objectKind: 'entity',
	temporalNature: 'permanent',
	claimType: 'factual',
} as const satisfies PredicateSpec;
