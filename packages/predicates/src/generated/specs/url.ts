import type { PredicateSpec } from '../../types.js';

export const url = {
	key: 'url',
	name: 'url',
	description: 'Links the subject atom to its canonical URL or web-addressable identifier',
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Metadata/Linking',
	status: 'enshrined',
	objectKind: 'literal',
	literalType: 'url',
	temporalNature: 'permanent',
	claimType: 'factual',
} as const satisfies PredicateSpec;
