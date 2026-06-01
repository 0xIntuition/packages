import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgSocialMediaPosting = {
	id: 'schema:SocialMediaPosting',
	name: 'SocialMediaPosting',
	label: 'SocialMediaPosting',
	comment: 'A post to a social media platform, including blog posts, tweets, Facebook posts, etc.',
	subClassOf: ['Article', 'CreativeWork', 'Thing'],
	properties: [
		{
			id: 'schema:sharedContent',
			name: 'sharedContent',
			label: 'sharedContent',
			comment:
				'A CreativeWork such as an image, video, or audio clip shared as part of this posting.',
			rangeIncludes: ['CreativeWork'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgSocialMediaPosting;
export const SocialMediaPosting = schemaOrgSocialMediaPosting;

export default schemaOrgSocialMediaPosting;
