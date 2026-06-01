import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgDislikeAction = {
	id: 'schema:DislikeAction',
	name: 'DislikeAction',
	label: 'DislikeAction',
	comment:
		'The act of expressing a negative sentiment about the object. An agent dislikes an object (a proposition, topic or theme) with participants.',
	subClassOf: ['ReactAction', 'AssessAction', 'Action', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgDislikeAction;
export const DislikeAction = schemaOrgDislikeAction;

export default schemaOrgDislikeAction;
