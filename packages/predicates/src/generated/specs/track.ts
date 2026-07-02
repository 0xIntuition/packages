import type { PredicateSpec } from '../../types.js';

export const track = {
	key: 'track',
	name: 'track',
	description:
		'The subject music album, playlist, or group includes the object music recording as a track',
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Curation/Containment',
	status: 'proposed',
	isHierarchical: true,
	objectKind: 'entity',
	temporalNature: 'permanent',
	claimType: 'factual',
} as const satisfies PredicateSpec;
