import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgUserInteraction = {
	id: 'schema:UserInteraction',
	name: 'UserInteraction',
	label: 'UserInteraction',
	comment:
		'UserInteraction and its subtypes is an old way of talking about users interacting with pages. It is generally better to use [[Action]]-based vocabulary, alongside types such as [[Comment]].',
	subClassOf: ['Event', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgUserInteraction;
export const UserInteraction = schemaOrgUserInteraction;

export default schemaOrgUserInteraction;
