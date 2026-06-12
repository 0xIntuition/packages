import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgRejectAction = {
	id: 'schema:RejectAction',
	name: 'RejectAction',
	label: 'RejectAction',
	comment:
		'The act of rejecting to/adopting an object.\\n\\nRelated actions:\\n\\n* [[AcceptAction]]: The antonym of RejectAction.',
	subClassOf: ['AllocateAction', 'OrganizeAction', 'Action', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgRejectAction;
export const RejectAction = schemaOrgRejectAction;

export default schemaOrgRejectAction;
