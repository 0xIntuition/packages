import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgArticle = {
	id: 'schema:Article',
	name: 'Article',
	label: 'Article',
	comment:
		'An article, such as a news article or piece of investigative report. Newspapers and magazines have articles of many different types and this is intended to cover them all.\\n\\nSee also [blog post](https://blog.schema.org/2014/09/02/schema-org-support-for-bibliographic-relationships-and-periodicals/).',
	subClassOf: ['CreativeWork', 'Thing'],
	properties: [
		{
			id: 'schema:articleBody',
			name: 'articleBody',
			label: 'articleBody',
			comment: 'The actual body of the article.',
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:articleSection',
			name: 'articleSection',
			label: 'articleSection',
			comment:
				"Articles may belong to one or more 'sections' in a magazine or newspaper, such as Sports, Lifestyle, etc.",
			rangeIncludes: ['Text'],
		},
		{
			id: 'schema:backstory',
			name: 'backstory',
			label: 'backstory',
			comment:
				'For an [[Article]], typically a [[NewsArticle]], the backstory property provides a textual summary giving a brief explanation of why and how an article was created. In a journalistic setting this could include information about reporting process, methods, interviews, data sources, etc.',
			rangeIncludes: ['CreativeWork', 'Text'],
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
		{
			id: 'schema:speakable',
			name: 'speakable',
			label: 'speakable',
			comment:
				"Indicates sections of a Web page that are particularly 'speakable' in the sense of being highlighted as being especially appropriate for text-to-speech conversion. Other sections of a page may also be usefully spoken in particular circumstances; the 'speakable' property serves to indicate the parts most likely to be generally useful for speech.\n\nThe *speakable* property can be repeated an arbitrary number of times, with three kinds of possible 'content-locator' values:\n\n1.) *id-value* URL references - uses *id-value* of an element in the page being annotated. The simplest use of *speakable* has (potentially relative) URL values, referencing identified sections of the document concerned.\n\n2.) CSS Selectors - addresses content in the annotated page, e.g. via class attribute. Use the [[cssSelector]] property.\n\n3.)  XPaths - addresses content via XPaths (assuming an XML view of the content). Use the [[xpath]] property.\n\n\nFor more sophisticated markup of speakable sections beyond simple ID references, either CSS selectors or XPath expressions to pick out document section(s) as speakable. For this\nwe define a supporting type, [[SpeakableSpecification]]  which is defined to be a possible value of the *speakable* property.\n         ",
			rangeIncludes: ['SpeakableSpecification', 'URL'],
		},
		{
			id: 'schema:wordCount',
			name: 'wordCount',
			label: 'wordCount',
			comment: 'The number of words in the text of the CreativeWork such as an Article, Book, etc.',
			rangeIncludes: ['Integer'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgArticle;
export const Article = schemaOrgArticle;

export default schemaOrgArticle;
