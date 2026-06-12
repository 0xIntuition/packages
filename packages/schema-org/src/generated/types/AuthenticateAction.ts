import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgAuthenticateAction = {
	id: 'schema:AuthenticateAction',
	name: 'AuthenticateAction',
	label: 'AuthenticateAction',
	comment: 'The action of authenticating into a device or application.',
	subClassOf: ['ControlAction', 'Action', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgAuthenticateAction;
export const AuthenticateAction = schemaOrgAuthenticateAction;

export default schemaOrgAuthenticateAction;
