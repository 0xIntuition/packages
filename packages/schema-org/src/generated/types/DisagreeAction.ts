import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgDisagreeAction = {
	id: 'schema:DisagreeAction',
	name: 'DisagreeAction',
	label: 'DisagreeAction',
	comment:
		'The act of expressing a difference of opinion with the object. An agent disagrees to/about an object (a proposition, topic or theme) with participants.',
	subClassOf: ['ReactAction', 'AssessAction', 'Action', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgDisagreeAction;
export const DisagreeAction = schemaOrgDisagreeAction;

export default schemaOrgDisagreeAction;
