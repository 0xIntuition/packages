import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgComment = {
	id: 'schema:Comment',
	name: 'Comment',
	label: 'Comment',
	comment:
		"A comment on an item - for example, a comment on a blog post. The comment's content is expressed via the [[text]] property, and its topic via [[about]], properties shared with all CreativeWorks.",
	subClassOf: ['CreativeWork', 'Thing'],
	properties: [
		{
			id: 'schema:downvoteCount',
			name: 'downvoteCount',
			label: 'downvoteCount',
			comment:
				'The number of downvotes this question, answer or comment has received from the community.',
			rangeIncludes: ['Integer'],
		},
		{
			id: 'schema:parentItem',
			name: 'parentItem',
			label: 'parentItem',
			comment:
				'The parent of a question, answer or item in general. Typically used for Q/A discussion threads e.g. a chain of comments with the first comment being an [[Article]] or other [[CreativeWork]]. See also [[comment]] which points from something to a comment about it.',
			rangeIncludes: ['Comment', 'CreativeWork'],
		},
		{
			id: 'schema:sharedContent',
			name: 'sharedContent',
			label: 'sharedContent',
			comment:
				'A CreativeWork such as an image, video, or audio clip shared as part of this posting.',
			rangeIncludes: ['CreativeWork'],
		},
		{
			id: 'schema:upvoteCount',
			name: 'upvoteCount',
			label: 'upvoteCount',
			comment:
				'The number of upvotes this question, answer or comment has received from the community.',
			rangeIncludes: ['Integer'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgComment;
export const Comment = schemaOrgComment;

export default schemaOrgComment;
