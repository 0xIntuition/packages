import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgReactAction = {
	id: 'schema:ReactAction',
	name: 'ReactAction',
	label: 'ReactAction',
	comment:
		'The act of responding instinctively and emotionally to an object, expressing a sentiment.',
	subClassOf: ['AssessAction', 'Action', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgReactAction;
export const ReactAction = schemaOrgReactAction;

export default schemaOrgReactAction;
