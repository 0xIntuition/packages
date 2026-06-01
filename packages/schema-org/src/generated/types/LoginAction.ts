import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgLoginAction = {
	id: 'schema:LoginAction',
	name: 'LoginAction',
	label: 'LoginAction',
	comment: 'The action of logging into a device or application.',
	subClassOf: ['ControlAction', 'Action', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgLoginAction;
export const LoginAction = schemaOrgLoginAction;

export default schemaOrgLoginAction;
