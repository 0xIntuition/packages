import type { PredicateSpec } from '../../types.js';

export const linkedAccount = {
	key: 'linkedAccount',
	name: 'linked account',
	description: 'Connects the subject identity to one of its platform account atoms',
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Metadata/Linking',
	status: 'enshrined',
} as const satisfies PredicateSpec;
