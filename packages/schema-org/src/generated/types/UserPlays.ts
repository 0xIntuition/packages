import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgUserPlays = {
	id: 'schema:UserPlays',
	name: 'UserPlays',
	label: 'UserPlays',
	comment:
		'UserInteraction and its subtypes is an old way of talking about users interacting with pages. It is generally better to use [[Action]]-based vocabulary, alongside types such as [[Comment]].',
	subClassOf: ['UserInteraction', 'Event', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgUserPlays;
export const UserPlays = schemaOrgUserPlays;

export default schemaOrgUserPlays;
