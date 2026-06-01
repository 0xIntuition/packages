import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgUserPlusOnes = {
	id: 'schema:UserPlusOnes',
	name: 'UserPlusOnes',
	label: 'UserPlusOnes',
	comment:
		'UserInteraction and its subtypes is an old way of talking about users interacting with pages. It is generally better to use [[Action]]-based vocabulary, alongside types such as [[Comment]].',
	subClassOf: ['UserInteraction', 'Event', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgUserPlusOnes;
export const UserPlusOnes = schemaOrgUserPlusOnes;

export default schemaOrgUserPlusOnes;
