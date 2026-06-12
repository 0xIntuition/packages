import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgAcceptAction = {
	id: 'schema:AcceptAction',
	name: 'AcceptAction',
	label: 'AcceptAction',
	comment:
		'The act of committing to/adopting an object.\\n\\nRelated actions:\\n\\n* [[RejectAction]]: The antonym of AcceptAction.',
	subClassOf: ['AllocateAction', 'OrganizeAction', 'Action', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgAcceptAction;
export const AcceptAction = schemaOrgAcceptAction;

export default schemaOrgAcceptAction;
