import type { PredicateSpec } from '../../types.js';

export const parentItem = {
	key: 'parentItem',
	name: 'parent item',
	description: 'The subject comment or item is a reply to or child of the object item',
	marketPattern: 'attributive',
	conjugates: false,
	category: 'Curation/Containment',
	status: 'proposed',
	isHierarchical: true,
} as const satisfies PredicateSpec;
