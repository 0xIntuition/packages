import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgListenAction = {
	id: 'schema:ListenAction',
	name: 'ListenAction',
	label: 'ListenAction',
	comment: 'The act of consuming audio content.',
	subClassOf: ['ConsumeAction', 'Action', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgListenAction;
export const ListenAction = schemaOrgListenAction;

export default schemaOrgListenAction;
