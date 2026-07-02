import type { PredicateSpec } from '../../types.js';

export const primaryImageOfPage = {
	key: 'primaryImageOfPage',
	name: 'primary image of page',
	description: 'The subject web page is primarily represented by the object image',
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Metadata/Linking',
	status: 'proposed',
	objectKind: 'literal',
	literalType: 'image',
	temporalNature: 'permanent',
	claimType: 'factual',
} as const satisfies PredicateSpec;
