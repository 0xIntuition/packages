import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgPublicationIssue = {
	id: 'schema:PublicationIssue',
	name: 'PublicationIssue',
	label: 'PublicationIssue',
	comment:
		'A part of a successively published publication such as a periodical or publication volume, often numbered, usually containing a grouping of works such as articles.\\n\\nSee also [blog post](https://blog-schema.org/2014/09/02/schema-org-support-for-bibliographic-relationships-and-periodicals/).',
	subClassOf: ['CreativeWork', 'Thing'],
	properties: [
		{
			id: 'schema:issueNumber',
			name: 'issueNumber',
			label: 'issueNumber',
			comment: 'Identifies the issue of publication; for example, "iii" or "2".',
			rangeIncludes: ['Integer', 'Text'],
		},
		{
			id: 'schema:pageEnd',
			name: 'pageEnd',
			label: 'pageEnd',
			comment: 'The page on which the work ends; for example "138" or "xvi".',
			rangeIncludes: ['Integer', 'Text'],
		},
		{
			id: 'schema:pageStart',
			name: 'pageStart',
			label: 'pageStart',
			comment: 'The page on which the work starts; for example "135" or "xiii".',
			rangeIncludes: ['Integer', 'Text'],
		},
		{
			id: 'schema:pagination',
			name: 'pagination',
			label: 'pagination',
			comment:
				'Any description of pages that is not separated into pageStart and pageEnd; for example, "1-6, 9, 55" or "10-12, 46-49".',
			rangeIncludes: ['Text'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgPublicationIssue;
export const PublicationIssue = schemaOrgPublicationIssue;

export default schemaOrgPublicationIssue;
