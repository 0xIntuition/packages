import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgAgreeAction = {
	id: 'schema:AgreeAction',
	name: 'AgreeAction',
	label: 'AgreeAction',
	comment:
		'The act of expressing a consistency of opinion with the object. An agent agrees to/about an object (a proposition, topic or theme) with participants.',
	subClassOf: ['ReactAction', 'AssessAction', 'Action', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgAgreeAction;
export const AgreeAction = schemaOrgAgreeAction;

export default schemaOrgAgreeAction;
