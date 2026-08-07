import type { PredicateSpec } from '../../types.js';

export const pinnedIn = {
	key: 'pinnedIn',
	name: 'pinned in',
	description:
		'The subject is pinned or highlighted within the object collection for prominent display',
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Curation/Containment',
	status: 'proposed',
	isHierarchical: true,
	objectKind: 'entity',
	temporalNature: 'state',
	claimType: 'factual',
} as const satisfies PredicateSpec;
