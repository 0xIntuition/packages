import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgApplyAction = {
	id: 'schema:ApplyAction',
	name: 'ApplyAction',
	label: 'ApplyAction',
	comment:
		'The act of registering to an organization/service without the guarantee to receive it.\\n\\nRelated actions:\\n\\n* [[RegisterAction]]: Unlike RegisterAction, ApplyAction has no guarantees that the application will be accepted.',
	subClassOf: ['OrganizeAction', 'Action', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgApplyAction;
export const ApplyAction = schemaOrgApplyAction;

export default schemaOrgApplyAction;
