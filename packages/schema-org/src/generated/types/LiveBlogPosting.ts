import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgLiveBlogPosting = {
	id: 'schema:LiveBlogPosting',
	name: 'LiveBlogPosting',
	label: 'LiveBlogPosting',
	comment:
		'A [[LiveBlogPosting]] is a [[BlogPosting]] intended to provide a rolling textual coverage of an ongoing event through continuous updates.',
	subClassOf: ['BlogPosting', 'SocialMediaPosting', 'Article', 'CreativeWork', 'Thing'],
	properties: [
		{
			id: 'schema:coverageEndTime',
			name: 'coverageEndTime',
			label: 'coverageEndTime',
			comment:
				'The time when the live blog will stop covering the Event. Note that coverage may continue after the Event concludes.',
			rangeIncludes: ['DateTime'],
		},
		{
			id: 'schema:coverageStartTime',
			name: 'coverageStartTime',
			label: 'coverageStartTime',
			comment:
				"The time when the live blog will begin covering the Event. Note that coverage may begin before the Event's start time. The LiveBlogPosting may also be created before coverage begins.",
			rangeIncludes: ['DateTime'],
		},
		{
			id: 'schema:liveBlogUpdate',
			name: 'liveBlogUpdate',
			label: 'liveBlogUpdate',
			comment: 'An update to the LiveBlog.',
			rangeIncludes: ['BlogPosting'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgLiveBlogPosting;
export const LiveBlogPosting = schemaOrgLiveBlogPosting;

export default schemaOrgLiveBlogPosting;
