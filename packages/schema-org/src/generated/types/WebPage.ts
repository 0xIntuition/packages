import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgWebPage = {
	id: 'schema:WebPage',
	name: 'WebPage',
	label: 'WebPage',
	comment:
		'A web page. Every web page is implicitly assumed to be declared to be of type WebPage, so the various properties about that webpage, such as <code>breadcrumb</code> may be used. We recommend explicit declaration if these properties are specified, but if they are found outside of an itemscope, they will be assumed to be about the page.',
	subClassOf: ['CreativeWork', 'Thing'],
	properties: [
		{
			id: 'schema:breadcrumb',
			name: 'breadcrumb',
			label: 'breadcrumb',
			comment: 'A set of links that can help a user understand and navigate a website hierarchy.',
			rangeIncludes: ['BreadcrumbList', 'Text'],
		},
		{
			id: 'schema:lastReviewed',
			name: 'lastReviewed',
			label: 'lastReviewed',
			comment:
				'Date on which the content on this web page was last reviewed for accuracy and/or completeness.',
			rangeIncludes: ['Date'],
		},
		{
			id: 'schema:mainContentOfPage',
			name: 'mainContentOfPage',
			label: 'mainContentOfPage',
			comment: 'Indicates if this web page element is the main subject of the page.',
			rangeIncludes: ['WebPageElement'],
		},
		{
			id: 'schema:primaryImageOfPage',
			name: 'primaryImageOfPage',
			label: 'primaryImageOfPage',
			comment: 'Indicates the main image on the page.',
			rangeIncludes: ['ImageObject'],
		},
		{
			id: 'schema:relatedLink',
			name: 'relatedLink',
			label: 'relatedLink',
			comment: 'A link related to this web page, for example to other related web pages.',
			rangeIncludes: ['URL'],
		},
		{
			id: 'schema:reviewedBy',
			name: 'reviewedBy',
			label: 'reviewedBy',
			comment:
				'People or organizations that have reviewed the content on this web page for accuracy and/or completeness.',
			rangeIncludes: ['Organization', 'Person'],
		},
		{
			id: 'schema:significantLink',
			name: 'significantLink',
			label: 'significantLink',
			comment:
				'One of the more significant URLs on the page. Typically, these are the non-navigation links that are clicked on the most.',
			rangeIncludes: ['URL'],
		},
		{
			id: 'schema:significantLinks',
			name: 'significantLinks',
			label: 'significantLinks',
			comment:
				'The most significant URLs on the page. Typically, these are the non-navigation links that are clicked on the most.',
			rangeIncludes: ['URL'],
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
			id: 'schema:specialty',
			name: 'specialty',
			label: 'specialty',
			comment: "One of the domain specialities to which this web page's content applies.",
			rangeIncludes: ['Specialty'],
		},
	],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgWebPage;
export const WebPage = schemaOrgWebPage;

export default schemaOrgWebPage;
