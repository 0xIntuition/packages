import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgUserComments = {
	id: 'schema:UserComments',
	name: 'UserComments',
	label: 'UserComments',
	comment:
		'UserInteraction and its subtypes is an old way of talking about users interacting with pages. It is generally better to use [[Action]]-based vocabulary, alongside types such as [[Comment]].',
	subClassOf: ['UserInteraction', 'Event', 'Thing'],
	properties: [
		{
			id: 'schema:commentText',
			name: 'commentText',
			label: 'commentText',
			comment: 'The text of the UserComment.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:commentTime',
			name: 'commentTime',
			label: 'commentTime',
			comment: 'The time at which the UserComment was made.',
			rangeIncludes: ['Date', 'DateTime'],
		},
		{
			id: 'schema:creator',
			name: 'creator',
			label: 'creator',
			comment:
				'The creator/author of this CreativeWork. This is the same as the Author property for CreativeWork.',
			rangeIncludes: ['Organization', 'Person'],
		},
		{
			id: 'schema:discusses',
			name: 'discusses',
			label: 'discusses',
			comment: 'Specifies the CreativeWork associated with the UserComment.',
			rangeIncludes: ['CreativeWork'],
		},
		{
			id: 'schema:replyToUrl',
			name: 'replyToUrl',
			label: 'replyToUrl',
			comment: 'The URL at which a reply may be posted to the specified UserComment.',
			rangeIncludes: ['URL'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgUserComments;
export const UserComments = schemaOrgUserComments;

export default schemaOrgUserComments;
