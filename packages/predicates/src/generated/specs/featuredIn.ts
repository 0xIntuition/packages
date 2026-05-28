import type { PredicateSpec } from '../../types.js';

export const featuredIn = {
	key: 'featuredIn',
	name: 'featured in',
	description: 'The subject is showcased or editorially promoted within the object context',
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Curation/Containment',
	status: 'proposed',
	isHierarchical: true,
} as const satisfies PredicateSpec;
