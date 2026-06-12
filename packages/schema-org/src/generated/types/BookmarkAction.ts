import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgBookmarkAction = {
	id: 'schema:BookmarkAction',
	name: 'BookmarkAction',
	label: 'BookmarkAction',
	comment: 'An agent bookmarks/flags/labels/tags/marks an object.',
	subClassOf: ['OrganizeAction', 'Action', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgBookmarkAction;
export const BookmarkAction = schemaOrgBookmarkAction;

export default schemaOrgBookmarkAction;
