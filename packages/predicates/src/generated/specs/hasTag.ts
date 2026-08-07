import type { PredicateSpec } from '../../types.js';

export const hasTag = {
	key: 'hasTag',
	name: 'has tag',
	description:
		'Assigns a free-form keyword or tag atom to the subject. Use for lightweight clustering, filtering, and discovery — tags are informal, many-per-subject, and carry no taxonomy guarantees (prefer `has type` or `has category` for structured classification)',
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Identity/Classification',
	status: 'enshrined',
	examples: ['(ETHGlobal, has tag, hackathon)', '(Rust, has tag, systems-programming)'],
	objectKind: 'entity',
	temporalNature: 'permanent',
	claimType: 'factual',
} as const satisfies PredicateSpec;
