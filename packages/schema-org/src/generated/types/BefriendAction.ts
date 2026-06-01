import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgBefriendAction = {
	id: 'schema:BefriendAction',
	name: 'BefriendAction',
	label: 'BefriendAction',
	comment:
		'The act of forming a personal connection with someone (object) mutually/bidirectionally/symmetrically.\\n\\nRelated actions:\\n\\n* [[FollowAction]]: Unlike FollowAction, BefriendAction implies that the connection is reciprocal.',
	subClassOf: ['InteractAction', 'Action', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgBefriendAction;
export const BefriendAction = schemaOrgBefriendAction;

export default schemaOrgBefriendAction;
