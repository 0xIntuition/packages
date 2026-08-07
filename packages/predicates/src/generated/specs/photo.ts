import type { PredicateSpec } from '../../types.js';

export const photo = {
	key: 'photo',
	name: 'photo',
	description: 'The subject place or entity is represented by the object image',
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Metadata/Linking',
	status: 'proposed',
	objectKind: 'literal',
	literalType: 'image',
	temporalNature: 'permanent',
	claimType: 'factual',
} as const satisfies PredicateSpec;
