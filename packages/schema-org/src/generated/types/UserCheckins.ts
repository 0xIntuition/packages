import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgUserCheckins = {
	id: 'schema:UserCheckins',
	name: 'UserCheckins',
	label: 'UserCheckins',
	comment:
		'UserInteraction and its subtypes is an old way of talking about users interacting with pages. It is generally better to use [[Action]]-based vocabulary, alongside types such as [[Comment]].',
	subClassOf: ['UserInteraction', 'Event', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgUserCheckins;
export const UserCheckins = schemaOrgUserCheckins;

export default schemaOrgUserCheckins;
