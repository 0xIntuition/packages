import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgShareAction = {
	id: 'schema:ShareAction',
	name: 'ShareAction',
	label: 'ShareAction',
	comment: 'The act of distributing content to people for their amusement or edification.',
	subClassOf: ['CommunicateAction', 'InteractAction', 'Action', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgShareAction;
export const ShareAction = schemaOrgShareAction;

export default schemaOrgShareAction;
