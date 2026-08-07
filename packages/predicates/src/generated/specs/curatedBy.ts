import type { PredicateSpec } from '../../types.js';

export const curatedBy = {
	key: 'curatedBy',
	name: 'curated by',
	description:
		'The subject collection or content set is maintained and organized by the object actor',
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Curation/Containment',
	status: 'enshrined',
	objectKind: 'entity',
	temporalNature: 'state',
	claimType: 'factual',
} as const satisfies PredicateSpec;
