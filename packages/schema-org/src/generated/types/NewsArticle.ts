import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgNewsArticle = {
	id: 'schema:NewsArticle',
	name: 'NewsArticle',
	label: 'NewsArticle',
	comment:
		'A NewsArticle is an article whose content reports news, or provides background context and supporting materials for understanding the news.\n\nA more detailed overview of [schema.org News markup](/docs/news.html) is also available.\n',
	subClassOf: ['Article', 'CreativeWork', 'Thing'],
	properties: [
		{
			id: 'schema:dateline',
			name: 'dateline',
			label: 'dateline',
			comment:
				'A [dateline](https://en.wikipedia.org/wiki/Dateline) is a brief piece of text included in news articles that describes where and when the story was written or filed though the date is often omitted. Sometimes only a placename is provided.\n\nStructured representations of dateline-related information can also be expressed more explicitly using [[locationCreated]] (which represents where a work was created, e.g. where a news report was written).  For location depicted or described in the content, use [[contentLocation]].\n\nDateline summaries are oriented more towards human readers than towards automated processing, and can vary substantially. Some examples: "BEIRUT, Lebanon, June 2.", "Paris, France", "December 19, 2017 11:43AM Reporting from Washington", "Beijing/Moscow", "QUEZON CITY, Philippines".\n      ',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:printColumn',
			name: 'printColumn',
			label: 'printColumn',
			comment: 'The number of the column in which the NewsArticle appears in the print edition.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:printEdition',
			name: 'printEdition',
			label: 'printEdition',
			comment: 'The edition of the print product in which the NewsArticle appears.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:printPage',
			name: 'printPage',
			label: 'printPage',
			comment:
				'If this NewsArticle appears in print, this field indicates the name of the page on which the article is found. Please note that this field is intended for the exact page name (e.g. A5, B18).',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:printSection',
			name: 'printSection',
			label: 'printSection',
			comment:
				'If this NewsArticle appears in print, this field indicates the print section in which the article appeared.',
			rangeIncludes: ['Text'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgNewsArticle;
export const NewsArticle = schemaOrgNewsArticle;

export default schemaOrgNewsArticle;
