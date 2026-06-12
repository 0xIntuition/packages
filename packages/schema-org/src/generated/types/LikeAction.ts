import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgLikeAction = {
	id: 'schema:LikeAction',
	name: 'LikeAction',
	label: 'LikeAction',
	comment:
		'The act of expressing a positive sentiment about the object. An agent likes an object (a proposition, topic or theme) with participants.',
	subClassOf: ['ReactAction', 'AssessAction', 'Action', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgLikeAction;
export const LikeAction = schemaOrgLikeAction;

export default schemaOrgLikeAction;
