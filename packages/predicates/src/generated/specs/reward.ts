import type { PredicateSpec } from '../../types.js';

export const reward = {
	key: 'reward',
	name: 'reward',
	description:
		'The subject protocol or program distributes incentives to the object participant class or actor',
	marketPattern: 'attributive',
	conjugates: true,
	thirdPerson: 'rewards',
	category: 'Economic/Market',
	status: 'proposed',
	objectKind: 'entity',
	polarity: 'positive',
	temporalNature: 'state',
	claimType: 'factual',
} as const satisfies PredicateSpec;
