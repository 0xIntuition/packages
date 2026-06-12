import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgDiscussionForumPosting = {
	id: 'schema:DiscussionForumPosting',
	name: 'DiscussionForumPosting',
	label: 'DiscussionForumPosting',
	comment: 'A posting to a discussion forum.',
	subClassOf: ['SocialMediaPosting', 'Article', 'CreativeWork', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgDiscussionForumPosting;
export const DiscussionForumPosting = schemaOrgDiscussionForumPosting;

export default schemaOrgDiscussionForumPosting;
