import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgResetPasswordAction = {
	id: 'schema:ResetPasswordAction',
	name: 'ResetPasswordAction',
	label: 'ResetPasswordAction',
	comment: 'The action of resetting the password of a device or application.',
	subClassOf: ['ControlAction', 'Action', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgResetPasswordAction;
export const ResetPasswordAction = schemaOrgResetPasswordAction;

export default schemaOrgResetPasswordAction;
