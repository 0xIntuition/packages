import type { PredicateSpec } from '../../types.js';

export const targetProduct = {
	key: 'targetProduct',
	name: 'target product',
	description:
		'The subject software source code targets or produces the object software application',
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Metadata/Linking',
	status: 'proposed',
	objectKind: 'entity',
	temporalNature: 'permanent',
	claimType: 'factual',
} as const satisfies PredicateSpec;
