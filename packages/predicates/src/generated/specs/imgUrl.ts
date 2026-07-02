import type { PredicateSpec } from '../../types.js';

export const imgUrl = {
	key: 'imgUrl',
	name: 'imgUrl',
	description:
		'Links the subject atom to an image URL. Legacy camelCase naming retained for backward compatibility',
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Metadata/Linking',
	status: 'enshrined',
	objectKind: 'literal',
	literalType: 'image',
	temporalNature: 'permanent',
	claimType: 'factual',
} as const satisfies PredicateSpec;
