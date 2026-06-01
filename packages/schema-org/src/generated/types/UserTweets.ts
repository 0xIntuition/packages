import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgUserTweets = {
	id: 'schema:UserTweets',
	name: 'UserTweets',
	label: 'UserTweets',
	comment:
		'UserInteraction and its subtypes is an old way of talking about users interacting with pages. It is generally better to use [[Action]]-based vocabulary, alongside types such as [[Comment]].',
	subClassOf: ['UserInteraction', 'Event', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgUserTweets;
export const UserTweets = schemaOrgUserTweets;

export default schemaOrgUserTweets;
