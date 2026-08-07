import type { PredicateSpec } from '../../types.js';

export const publishedAt = {
	key: 'publishedAt',
	name: 'published at',
	description:
		'Indicates the platform, venue, or location where the subject was published or released',
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Metadata/Linking',
	status: 'proposed',
	objectKind: 'entity',
	temporalNature: 'permanent',
	claimType: 'factual',
} as const satisfies PredicateSpec;
