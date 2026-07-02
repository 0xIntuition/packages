import type { PredicateSpec } from '../../types.js';

export const auditedBy = {
	key: 'auditedBy',
	name: 'audited by',
	description:
		'The subject has undergone a formal security, financial, or compliance audit by the object firm',
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Provenance/Evidence',
	status: 'proposed',
	objectKind: 'entity',
	temporalNature: 'permanent',
	claimType: 'factual',
} as const satisfies PredicateSpec;
